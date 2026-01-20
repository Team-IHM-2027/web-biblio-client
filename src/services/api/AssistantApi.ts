import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../configs/firebase';
import type { OrgSettings } from '../../types/config';
import { defaultOrgSettings } from '../../constants/defaultOrgSettings';

export interface LibraryInfo {
  name: string;
  address: string;
  contact: {
    email: string;
    facebook: string;
    instagram: string;
    phone: string;
    whatsapp: string;
  };
  openingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  borrowingRules: {
    maxLoans: number;
    specificRules: string[];
    latePenalties: string[];
  };
  logo?: string;
  theme?: {
    primary: string;
    secondary: string;
  };
}

export interface QuickSuggestion {
  text: string;
  query: string;
}

export interface ChatResponse {
  success: boolean;
  data: {
    response: string;
    metadata: {
      query: string;
      timestamp: string;
      orgName: string;
    };
  };
}

export interface SuggestionsResponse {
  success: boolean;
  data: QuickSuggestion[];
}

export interface LibraryInfoResponse {
  success: boolean;
  data: LibraryInfo;
}

export interface BookAvailability {
  available: boolean;
  bookName: string;
  author?: string;
  canReserve: boolean;
  reasons: string[];
  currentStatus?: 'available' | 'reserved' | 'borrowed' | 'unavailable';
  exemplaireCount?: number;
}

// Small type aliases to reuse the OrgSettings structure
type OpeningHours = OrgSettings['OpeningHours'];
type Contact = OrgSettings['Contact'];

export class AssistantApi {
  private baseURL: string;
  private headers: HeadersInit;
  private cache: {
    libraryInfo: Map<string, { data: LibraryInfo; timestamp: number }>;
    orgSettings: { settings?: OrgSettings; expiresAt?: number } | null;
  };
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(baseURL?: string) {
    // Use provided baseURL, then env var, then empty string
    this.baseURL = baseURL || import.meta.env.VITE_ASSISTANT_API_URL || '';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    this.cache = {
      libraryInfo: new Map(),
      orgSettings: null,
    };
  }

  // If external assistant API is configured, check health; otherwise return true if Firebase is configured
  async checkHealth(): Promise<boolean> {
    if (this.baseURL) {
      try {
        const response = await fetch(`${this.baseURL}/health`, {
          method: 'GET',
          headers: this.headers,
        });
        return response.ok;
      } catch {
        return false;
      }
    } else {
      // If using direct Firebase reads assume local health is true (or attempt a minimal read)
      try {
        const ref = doc(db, 'Configuration', 'OrgSettings');
        await getDoc(ref);
        return true;
      } catch (err) {
        console.error('Firebase health check failed:', err);
        return false;
      }
    }
  }

  // Get library information with caching. If baseURL set call external API, otherwise read Firestore.
  async getLibraryInfo(orgName: string = 'OrgSettings'): Promise<LibraryInfo | null> {
    if (this.baseURL) {
      try {
        const cacheKey = orgName;
        const now = Date.now();
        const cached = this.cache.libraryInfo.get(cacheKey);
        if (cached && now - cached.timestamp < this.CACHE_DURATION) {
          return cached.data;
        }

        const response = await fetch(
          `${this.baseURL}/library-info?orgName=${encodeURIComponent(orgName)}`,
          {
            method: 'GET',
            headers: this.headers,
          }
        );

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data: LibraryInfoResponse = await response.json();
        if (!data.success) throw new Error('Assistant API returned success=false');

        this.cache.libraryInfo.set(cacheKey, { data: data.data, timestamp: now });
        return data.data;
      } catch (error) {
        console.error('Error fetching library info from assistant API:', error);
        return this.getMockLibraryInfo();
      }
    }

    // If no external API: use Firestore directly
    try {
      const orgSettings = await this.fetchOrgConfiguration(orgName);
      const info: LibraryInfo = {
        name: orgSettings.Name,
        address: orgSettings.Address,
        contact: {
          email: orgSettings.Contact?.Email || '',
          facebook: orgSettings.Contact?.Facebook || '',
          instagram: orgSettings.Contact?.Instagram || '',
          phone: orgSettings.Contact?.Phone || '',
          whatsapp: orgSettings.Contact?.WhatsApp || '',
        },
        openingHours: {
          monday: orgSettings.OpeningHours?.Monday || '',
          tuesday: orgSettings.OpeningHours?.Tuesday || '',
          wednesday: orgSettings.OpeningHours?.Wednesday || '',
          thursday: orgSettings.OpeningHours?.Thursday || '',
          friday: orgSettings.OpeningHours?.Friday || '',
          saturday: orgSettings.OpeningHours?.Saturday || '',
          sunday: orgSettings.OpeningHours?.Sunday || ''
        },
        borrowingRules: {
          maxLoans: orgSettings.MaximumSimultaneousLoans || defaultOrgSettings.MaximumSimultaneousLoans,
          specificRules: orgSettings.SpecificBorrowingRules || [],
          latePenalties: orgSettings.LateReturnPenalties || []
        },
        logo: orgSettings.Logo || undefined,
        theme: orgSettings.Theme ? {
          primary: orgSettings.Theme.Primary,
          secondary: orgSettings.Theme.Secondary
        } : undefined
      };

      // cache
      const cacheKey = orgName;
      this.cache.libraryInfo.set(cacheKey, { data: info, timestamp: Date.now() });
      return info;
    } catch (err) {
      console.error('Error fetching library info from Firestore:', err);
      return this.getMockLibraryInfo();
    }
  }

  // Get assistant response: if external API configured, call it; otherwise synthesize from Firestore config
  async getAssistantResponse(query: string, orgName: string = 'OrgSettings'): Promise<string> {
    if (this.baseURL) {
      // call external API
      try {
        const response = await fetch(`${this.baseURL}/chat`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ message: query, orgName }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }

        const data: ChatResponse = await response.json();
        if (!data.success) throw new Error('Assistant API returned success=false');

        return data.data.response;
      } catch (error) {
        console.error('Error getting assistant response from API:', error);
        return this.getMockResponse(query);
      }
    }

    // No external API: generate response using Firestore data
    try {
      const orgSettings = await this.fetchOrgConfiguration(orgName);
      const normalizedQuery = query.toLowerCase().trim();

      if (this.containsAny(normalizedQuery, ['bonjour', 'salut', 'hello', 'hey', 'coucou'])) {
        return `Bonjour! Bienvenue à la bibliothèque ${orgSettings.Name}. Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?`;
      }

      if (this.containsAny(normalizedQuery, ['heure', 'horaires', 'ouvert', 'fermé', 'ouverture', 'fermeture'])) {
        return this.formatOpeningHours(orgSettings.OpeningHours, orgSettings.Name);
      }

      if (this.containsAny(normalizedQuery, ['règle', 'règlement', 'politique', 'emprunt', 'prêt'])) {
        return this.formatBorrowingRules(orgSettings);
      }

      if (this.containsAny(normalizedQuery, ['contact', 'email', 'téléphone', 'tél', 'phone', 'whatsapp', 'facebook', 'instagram'])) {
        return this.formatContactInfo(orgSettings.Contact, orgSettings.Name);
      }

      if (this.containsAny(normalizedQuery, ['adresse', 'localisation', 'où', 'trouver', 'lieu'])) {
        return this.formatAddress(orgSettings.Address, orgSettings.Name);
      }

      if (this.containsAny(normalizedQuery, ['réserver', 'réservation', 'booking', 'hold'])) {
        return this.formatReservationProcedures(orgSettings);
      }

      if (this.containsAny(normalizedQuery, ['amende', 'pénalité', 'retard', 'late', 'fine'])) {
        return this.formatLatePenalties(orgSettings);
      }

      if (this.containsAny(normalizedQuery, ['prolonger', 'renouveler', 'extension'])) {
        return this.formatExtensionConditions(orgSettings);
      }

      // Book availability check
      if (this.containsAny(normalizedQuery, ['livre', 'livres', 'document', 'titre', 'auteur', 'disponible', 'disponibilité'])) {
        const { bookName, author } = this.extractBookInfoFromQuery(normalizedQuery);
        
        if (bookName) {
          const availability = await this.checkBookAvailability(bookName, author || undefined);
          return this.formatBookAvailability(availability);
        } else {
          return "Pour vérifier la disponibilité d'un livre, veuillez me fournir son titre. Par exemple : \"Est-ce que le livre 'Le Petit Prince' est disponible ?\"";
        }
      }

      if (this.containsAny(normalizedQuery, ['merci', 'remerci', 'gratitude'])) {
        return "Je vous en prie! N'hésitez pas si vous avez d'autres questions.";
      }

      // fallback
      return this.generateDefaultResponse(orgSettings, query);
    } catch (err) {
      console.error('Error building assistant response from Firestore:', err);
      return this.getMockResponse(query);
    }
  }

  // Check book availability
  async checkBookAvailability(bookName: string, author?: string): Promise<BookAvailability> {
    try {
      console.log(`[AssistantApi] Searching for book: "${bookName}"${author ? ` by ${author}` : ''}`);
      
      // Search for book in Firestore
      const booksCollectionRef = collection(db, 'BiblioBooks');
      
      // First, try to find exact match by name
      const exactQuery = query(
        booksCollectionRef,
        where('name', '==', bookName)
      );
      
      const exactSnapshot = await getDocs(exactQuery);
      let books: any[] = [];
      
      exactSnapshot.forEach((doc) => {
        const data = doc.data();
        books.push({ id: doc.id, ...data });
        console.log(`[AssistantApi] Exact match found: ${data.name || data.title}`);
      });
      
      // If no exact match, try case-insensitive search
      if (books.length === 0) {
        console.log(`[AssistantApi] No exact match, trying broader search...`);
        const allBooksSnapshot = await getDocs(booksCollectionRef);
        
        allBooksSnapshot.forEach((doc) => {
          const data = doc.data();
          const bookTitle = data.name || data.title || '';
          //@ts-ignore
          const _bookAuthor = data.author || data.auteur || '';
          
          if (bookTitle.toLowerCase().includes(bookName.toLowerCase())) {
            console.log(`[AssistantApi] Partial match found: "${bookTitle}"`);
            books.push({ id: doc.id, ...data });
          }
        });
      }
      
      console.log(`[AssistantApi] Total matches found: ${books.length}`);
      
      // Filter by author if provided
      let matchingBooks = books;
      if (author && books.length > 0) {
        matchingBooks = books.filter(book => {
          const bookAuthor = (book.author || book.auteur || '').toLowerCase();
          const searchAuthor = author.toLowerCase();
          return bookAuthor.includes(searchAuthor) || searchAuthor.includes(bookAuthor);
        });
        console.log(`[AssistantApi] After author filter: ${matchingBooks.length} matches`);
      }
      
      if (matchingBooks.length === 0) {
        console.log(`[AssistantApi] No matching books found`);
        return {
          available: false,
          bookName,
          author,
          canReserve: false,
          reasons: ["❌ Livre non trouvé dans notre catalogue"],
          currentStatus: 'unavailable'
        };
      }
      
      const book = matchingBooks[0];
      const bookId = book.id;
      const bookTitle = book.name || book.title || bookName;
      const bookAuthor = book.author || book.auteur || author;
      const totalCopies = book.exemplaire || book.exemplaires || 0;
      
      console.log(`[AssistantApi] Selected book: "${bookTitle}" by ${bookAuthor}`);
      console.log(`[AssistantApi] Book ID: ${bookId}`);
      console.log(`[AssistantApi] Total copies: ${totalCopies}`);
      
      // Check how many copies are currently in use
      const usersCollectionRef = collection(db, 'BiblioUser');
      const usersSnapshot = await getDocs(usersCollectionRef);
      
      let inUseCopies = 0;
      const inUseDetails: string[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Check all possible states (etat1, etat2, etat3... up to max loans)
        for (let i = 1; i <= 10; i++) {
          const stateKey = `etat${i}`;
          const tabKey = `tabEtat${i}`;
          
          if (userData[stateKey] && (userData[stateKey] === 'reserv' || userData[stateKey] === 'emprunt')) {
            const tabData = userData[tabKey];
            // Compare by book ID or title
            if (tabData && (tabData[0] === bookId || tabData[0] === bookTitle)) {
              inUseCopies++;
              const userName = userData.name || userData.email || 'un utilisateur';
              const status = userData[stateKey] === 'reserv' ? 'réservé' : 'emprunté';
              inUseDetails.push(`${status} par ${userName}`);
              console.log(`[AssistantApi] Copy in use: ${status} by ${userName}`);
            }
          }
        }
      }
      
      // Calculate available copies
      const availableCopies = Math.max(0, totalCopies - inUseCopies);
      const canReserve = availableCopies > 0;
      
      const reasons: string[] = [];
      
      if (availableCopies > 0) {
        reasons.push(`✅ ${availableCopies} exemplaire(s) disponible(s) sur ${totalCopies}`);
      } else {
        reasons.push("❌ Aucun exemplaire disponible actuellement");
      }
      
      if (inUseCopies > 0) {
        reasons.push(`📚 ${inUseCopies} exemplaire(s) en cours d'utilisation:`);
        inUseDetails.forEach(detail => {
          reasons.push(`  • ${detail}`);
        });
      }
      
      // Determine current status
      let currentStatus: 'available' | 'reserved' | 'borrowed' | 'unavailable';
      if (availableCopies > 0) {
        currentStatus = 'available';
      } else if (inUseCopies > 0) {
        // Check if any copy is reserved (not just borrowed)
        const hasReservedCopies = inUseDetails.some(detail => detail.includes('réservé'));
        currentStatus = hasReservedCopies ? 'reserved' : 'borrowed';
      } else {
        currentStatus = 'unavailable';
      }
      
      return {
        available: availableCopies > 0,
        bookName: bookTitle,
        author: bookAuthor,
        canReserve,
        reasons,
        currentStatus,
        exemplaireCount: availableCopies
      };
      
    } catch (error) {
      console.error('[AssistantApi] Error checking book availability:', error);
      return {
        available: false,
        bookName,
        author,
        canReserve: false,
        reasons: ["❌ Impossible de vérifier la disponibilité. Veuillez contacter la bibliothèque."],
        currentStatus: 'unavailable'
      };
    }
  }


  // Quick suggestions: use Firestore config when available
  async getQuickSuggestions(orgName: string = 'OrgSettings'): Promise<QuickSuggestion[]> {
    if (this.baseURL) {
      try {
        const response = await fetch(`${this.baseURL}/suggestions?orgName=${encodeURIComponent(orgName)}`, {
          method: 'GET',
          headers: this.headers,
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data: SuggestionsResponse = await response.json();
        if (!data.success) throw new Error('Assistant API returned success=false');
        return data.data;
      } catch (err) {
        console.error('Error fetching suggestions from API:', err);
        return this.getDefaultSuggestions();
      }
    }

    try {
      const orgSettings = await this.fetchOrgConfiguration(orgName);
      const suggestions: QuickSuggestion[] = [
        { text: "📅 Horaires", query: "Quels sont les horaires d'ouverture ?" },
        { text: "📚 Règles", query: "Quelles sont les règles d'emprunt ?" },
        { text: "🔖 Réserver", query: "Comment réserver un livre ?" }
      ];

      if (orgSettings.Contact && (orgSettings.Contact.Email || orgSettings.Contact.Phone)) {
        suggestions.splice(2, 0, { text: "📞 Contact", query: "Comment contacter la bibliothèque ?" });
      }
      if (orgSettings.Address) {
        suggestions.push({ text: "📍 Adresse", query: "Où se trouve la bibliothèque ?" });
      }
      if (orgSettings.LateReturnPenalties && orgSettings.LateReturnPenalties.length > 0) {
        suggestions.push({ text: "⚠️ Amendes", query: "Quelles sont les pénalités pour retard ?" });
      }

      // Add book search suggestion
      suggestions.push({ text: "🔍 Chercher un livre", query: "Est-ce que le livre [titre] est disponible ?" });

      return suggestions;
    } catch (err) {
      console.error('Error fetching quick suggestions from Firestore:', err);
      return this.getDefaultSuggestions();
    }
  }

  // -------------------- Firestore helpers --------------------
  private async fetchOrgConfiguration(orgName: string = 'OrgSettings'): Promise<OrgSettings> {
    try {
      const now = Date.now();
      if (this.cache.orgSettings?.settings && this.cache.orgSettings.expiresAt && now < this.cache.orgSettings.expiresAt) {
        return this.cache.orgSettings.settings;
      }

      const ref = doc(db, 'Configuration', orgName);
      const snap = await getDoc(ref);

      let settings: OrgSettings;
      if (snap.exists()) {
        const data = snap.data() as Partial<OrgSettings>;
        settings = this.mergeWithDefaults(data);
      } else {
        settings = defaultOrgSettings;
      }

      this.cache.orgSettings = { settings, expiresAt: now + this.CACHE_DURATION };
      return settings;
    } catch (err) {
      console.error('Error fetching OrgConfiguration from Firestore:', err);
      return defaultOrgSettings;
    }
  }

  // -------------------- Helper methods for book search --------------------
  private extractBookInfoFromQuery(query: string): { bookName: string | null; author: string | null } {
    // Remove common French question patterns
    const cleanQuery = query
      .replace(/^(est-ce que|est ce que|est-ce|est ce)/i, '')
      .replace(/^(le livre|livre|l'ouvrage|ouvrage)/i, '')
      .replace(/(est disponible|est-il disponible|peut.*reserver|peut.*réserver)\??/i, '')
      .replace(/^de\s+/i, '')
      .trim();
    
    console.log('[AssistantApi] Cleaned query:', cleanQuery);
    
    // Pattern 1: "livre 'titre' de 'auteur'"
    const pattern1 = /["']([^"']+)["']\s+(?:de\s+)?([^"']+)?/i;
    const match1 = cleanQuery.match(pattern1);
    if (match1) {
      console.log('[AssistantApi] Pattern 1 match:', match1);
      return {
        bookName: match1[1].trim(),
        author: match1[2]?.trim() || null
      };
    }
    
    // Pattern 2: "titre de auteur"
    const pattern2 = /^([^,]+?)(?:\s+de\s+|\s+par\s+|\s+-\s+)(.+)$/i;
    const match2 = cleanQuery.match(pattern2);
    if (match2) {
      console.log('[AssistantApi] Pattern 2 match:', match2);
      return {
        bookName: match2[1].trim(),
        author: match2[2].trim()
      };
    }
    
    // Pattern 3: Just the book title (look for quotes)
    const pattern3 = /["']([^"']+)["']/;
    const match3 = cleanQuery.match(pattern3);
    if (match3) {
      console.log('[AssistantApi] Pattern 3 match:', match3);
      return { bookName: match3[1].trim(), author: null };
    }
    
    // Pattern 4: If query starts with specific book search patterns
    if (cleanQuery.includes('livre') || cleanQuery.includes('titre')) {
      // Extract text after keywords
      const livreIndex = cleanQuery.indexOf('livre');
      const titreIndex = cleanQuery.indexOf('titre');
      const startIndex = Math.max(livreIndex, titreIndex);
      
      if (startIndex !== -1) {
        const afterKeyword = cleanQuery.substring(startIndex).replace(/(livre|titre)/i, '').trim();
        console.log('[AssistantApi] Pattern 4 - after keyword:', afterKeyword);
        
        // Try to split by "de" for author
        const deIndex = afterKeyword.indexOf(' de ');
        if (deIndex !== -1) {
          return {
            bookName: afterKeyword.substring(0, deIndex).trim(),
            author: afterKeyword.substring(deIndex + 4).trim()
          };
        }
        
        return { bookName: afterKeyword, author: null };
      }
    }
    
    // Fallback: Use the entire cleaned query
    console.log('[AssistantApi] Fallback - using entire query');
    return { bookName: cleanQuery || null, author: null };
  }
  private formatBookAvailability(availability: BookAvailability): string {
    let response = `📚 Information sur "${availability.bookName}"`;
    
    if (availability.author) {
      response += ` par ${availability.author}`;
    }
    
    response += '\n\n';
    
    // Status indicator
    switch (availability.currentStatus) {
      case 'available':
        response += "🟢 **DISPONIBLE**\n";
        break;
      case 'reserved':
        response += "🟡 **PARTIELLEMENT RÉSERVÉ**\n";
        break;
      case 'borrowed':
        response += "🟠 **PARTIELLEMENT EMPRUNTÉ**\n";
        break;
      case 'unavailable':
        response += "🔴 **INDISPONIBLE**\n";
        break;
    }
    
    response += '\n';
    
    if (availability.canReserve) {
      response += "✅ **Vous pouvez réserver ce livre !**\n\n";
    } else {
      response += "❌ **Vous ne pouvez pas réserver ce livre pour le moment.**\n\n";
    }
    
    if (availability.reasons && availability.reasons.length > 0) {
      response += "📋 Détails :\n";
      availability.reasons.forEach(reason => {
        response += `${reason}\n`;
      });
    }
    
    response += "\n\n💡 **Pour réserver ce livre :**";
    response += "\n1. Connectez-vous à votre compte";
    response += "\n2. Recherchez le livre dans le catalogue";
    response += "\n3. Cliquez sur 'Réserver'";
    response += "\n4. Choisissez votre créneau de retrait";
    
    return response;
  }
  // -------------------- Formatting helpers (similar to LibrarianApi) --------------------
  private formatOpeningHours(hours: OpeningHours, libraryName: string): string {
    const days = [
      { name: 'Lundi', key: 'Monday', hours: hours.Monday },
      { name: 'Mardi', key: 'Tuesday', hours: hours.Tuesday },
      { name: 'Mercredi', key: 'Wednesday', hours: hours.Wednesday },
      { name: 'Jeudi', key: 'Thursday', hours: hours.Thursday },
      { name: 'Vendredi', key: 'Friday', hours: hours.Friday },
      { name: 'Samedi', key: 'Saturday', hours: hours.Saturday },
      { name: 'Dimanche', key: 'Sunday', hours: hours.Sunday }
    ];

    // Parse and format each day
    const formattedDays = days.map(day => {
      try {
        const dayHours = day.hours;
        
        // Check if it's a JSON string
        if (dayHours && typeof dayHours === 'string' && dayHours.includes('{')) {
          const parsed = JSON.parse(dayHours);
          
          if (parsed.open === 'closed' || parsed.close === 'closed') {
            return { name: day.name, formatted: 'Fermé', isClosed: true };
          }
          
          // Format time nicely
          const openTime = this.formatTime(parsed.open);
          const closeTime = this.formatTime(parsed.close);
          return { 
            name: day.name, 
            formatted: `${openTime} - ${closeTime}`,
            isClosed: false 
          };
        }
        
        // If already a simple string (e.g., "9h-18h")
        if (dayHours && dayHours !== 'Fermé') {
          return { name: day.name, formatted: dayHours, isClosed: false };
        }
        
        // Closed or empty
        return { name: day.name, formatted: 'Fermé', isClosed: true };
        
      } catch (error) {
        console.error(`Error parsing hours for ${day.name}:`, error);
        return { name: day.name, formatted: 'Horaire non disponible', isClosed: false };
      }
    });

    // Separate open and closed days
    const openDays = formattedDays.filter(day => !day.isClosed && day.formatted !== 'Horaire non disponible');
    const closedDays = formattedDays.filter(day => day.isClosed);
    const unavailableDays = formattedDays.filter(day => day.formatted === 'Horaire non disponible');

    // Build response with proper line breaks
    let response = `🕐 Horaires d'ouverture de ${libraryName}:\n\n`;
    
    if (openDays.length > 0) {
      response += "📅 Jours d'ouverture:\n";
      openDays.forEach(day => {
        response += `• ${day.name}: ${day.formatted}\n`;
      });
      response += "\n";
    }
    
    if (closedDays.length > 0) {
      response += "🚫 Jours de fermeture:\n";
      closedDays.forEach(day => {
        response += `• ${day.name}: ${day.formatted}\n`;
      });
      response += "\n";
    }
    
    if (unavailableDays.length > 0) {
      response += "❓ Horaires non disponibles:\n";
      unavailableDays.forEach(day => {
        response += `• ${day.name}\n`;
      });
      response += "\n";
    }

    // Add today's hours with proper spacing
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayIndex = today === 0 ? 6 : today - 1; // Adjust for our array (Monday = 0)
    const todayInfo = formattedDays[todayIndex];
    
    if (todayInfo && todayInfo.formatted !== 'Horaire non disponible') {
      response += `📌 Aujourd'hui (${todayInfo.name}): ${todayInfo.isClosed ? 'Fermé' : todayInfo.formatted}`;
    }

    return response;
  }

  // Add helper method to format time
  private formatTime(timeStr: string): string {
    if (!timeStr || timeStr === 'closed') return 'Fermé';
    
    // Remove quotes if present
    const cleanTime = timeStr.replace(/"/g, '').trim();
    
    // Convert "08:00" to "8h" or "14:30" to "14h30"
    const match = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      
      if (minutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    // If already in French format (e.g., "9h-18h"), return as is
    return cleanTime;
  }

  private formatBorrowingRules(config: OrgSettings): string {
    let response = `📚 Règles d'emprunt de ${config.Name}:\n\n`;
    response += `• Nombre maximum d'emprunts simultanés: ${config.MaximumSimultaneousLoans}\n`;
    if (config.SpecificBorrowingRules && config.SpecificBorrowingRules.length > 0) {
      response += "\nRègles spécifiques:\n";
      config.SpecificBorrowingRules.forEach(rule => (response += `• ${rule}\n`));
    }
    if (config.LateReturnPenalties && config.LateReturnPenalties.length > 0) {
      response += "\n⚠️ Pénalités pour retard:\n";
      config.LateReturnPenalties.forEach(p => (response += `• ${p}\n`));
    }
    return response;
  }

  private formatContactInfo(contact: Contact | undefined, libraryName: string): string {
    const c = contact || defaultOrgSettings.Contact;
    let response = `📞 Contacts de ${libraryName}:\n\n`;
    if (c.Phone) response += `• Téléphone: ${c.Phone}\n`;
    if (c.Email) response += `• Email: ${c.Email}\n`;
    if (c.WhatsApp) response += `• WhatsApp: ${c.WhatsApp}\n`;
    if (c.Facebook) response += `• Facebook: ${c.Facebook}\n`;
    if (c.Instagram) response += `• Instagram: ${c.Instagram}\n`;
    return response;
  }

  private formatAddress(address: string | undefined, libraryName: string): string {
    return `📍 ${libraryName}\nAdresse: ${address || 'Non configurée'}`;
  }

  private formatReservationProcedures(config: OrgSettings): string {
    const procedures: string[] = [];
    procedures.push(`📋 Procédures de réservation à ${config.Name}:`);
    procedures.push(`1. Recherchez le livre dans notre catalogue en ligne`);
    procedures.push(`2. Cliquez sur "Réserver" sur la page du livre`);
    procedures.push(`3. Connectez-vous à votre compte bibliothèque`);
    procedures.push(`4. Choisissez la date de retrait souhaitée`);
    procedures.push(`5. Confirmez la réservation`);
    procedures.push(`\nℹ️ Informations importantes:`);
    procedures.push(`• Vous pouvez réserver jusqu'à ${config.MaximumSimultaneousLoans} livres simultanément`);
    procedures.push(`• La réservation est valable 3 jours ouvrables`);
    procedures.push(`• Présentez votre carte de bibliothèque lors du retrait`);
    return procedures.join('\n');
  }

  private formatLatePenalties(config: OrgSettings): string {
    if (!config.LateReturnPenalties || config.LateReturnPenalties.length === 0) {
      return "Les informations sur les pénalités pour retard ne sont pas encore configurées.";
    }
    let response = "⚠️ Pénalités pour retard:\n\n";
    config.LateReturnPenalties.forEach(p => (response += `• ${p}\n`));
    return response;
  }

  private formatExtensionConditions(config: OrgSettings): string {
    const conditions: string[] = [];
    conditions.push(`🔄 Conditions de prolongation à ${config.Name}:`);
    conditions.push(`1. Connectez-vous à votre compte bibliothèque`);
    conditions.push(`2. Accédez à "Mes emprunts"`);
    conditions.push(`3. Sélectionnez le livre à prolonger`);
    conditions.push(`4. Cliquez sur "Prolonger l'emprunt"`);
    conditions.push(`5. Confirmez la nouvelle date de retour`);
    conditions.push(`\n📌 Conditions importantes:`);
    conditions.push(`• La prolongation n'est possible que si le livre n'est pas réservé`);
    conditions.push(`• Vous pouvez prolonger jusqu'à 2 fois`);
    conditions.push(`• La durée de prolongation est de 14 jours`);
    return conditions.join('\n');
  }

  private generateDefaultResponse(config: OrgSettings, originalQuery: string): string {
    return `Je comprends que vous demandez: "${originalQuery}"\n\nÀ la bibliothèque ${config.Name}, je peux vous aider avec:\n\n• 📅 Les horaires d'ouverture\n• 📚 Les règles d'emprunt\n• 📞 Les informations de contact\n• 📍 L'adresse de la bibliothèque\n• 🔖 Les procédures de réservation\n• ⚠️ Les pénalités pour retard\n• 🔍 La disponibilité des livres\n\nPouvez-vous préciser votre question ou choisir l'une de ces catégories ?`;
  }

  private getDefaultSuggestions(): QuickSuggestion[] {
    return [
      { text: "📅 Horaires", query: "Quels sont les horaires d'ouverture ?" },
      { text: "📚 Règles", query: "Quelles sont les règles d'emprunt ?" },
      { text: "📞 Contact", query: "Comment contacter la bibliothèque ?" },
      { text: "📍 Adresse", query: "Où se trouve la bibliothèque ?" },
      { text: "🔖 Réserver", query: "Comment réserver un livre ?" },
      { text: "⚠️ Amendes", query: "Quelles sont les pénalités pour retard ?" },
      { text: "🔍 Chercher un livre", query: "Est-ce que le livre [titre] est disponible ?" },
    ];
  }

  private getMockLibraryInfo(): LibraryInfo {
    return {
      name: "",
      address: "",
      contact: {
        email: "",
        facebook: "",
        instagram: "",
        phone: "+237 123456789",
        whatsapp: "+237 123456789"
      },
      openingHours: {
        monday: "9h-18h",
        tuesday: "9h-18h",
        wednesday: "9h-18h",
        thursday: "9h-20h",
        friday: "9h-18h",
        saturday: "10h-18h",
        sunday: "Fermé"
      },
      borrowingRules: {
        maxLoans: 10,
        specificRules: [""],
        latePenalties: [""]
      },
      theme: {
        primary: "#2563eb",
        secondary: "#3b82f6"
      }
    };
  }

  private getMockResponse(query: string): string {
    const lowerQuery = query.toLowerCase().trim();
    if (lowerQuery.includes('bonjour') || lowerQuery.includes('salut') || lowerQuery.includes('hello')) {
      return "Bonjour! Je suis l'assistant de la Bibliothèque Municipale. Comment puis-je vous aider aujourd'hui ?";
    }
    if (lowerQuery.includes('heure') || lowerQuery.includes('horaire') || lowerQuery.includes('ouvrir') || lowerQuery.includes('fermé')) {
      return `🕐 Horaires d'ouverture - Bibliothèque Municipale:\n\nLundi: 9h-18h\nMardi: 9h-18h\nMercredi: 9h-18h\nJeudi: 9h-20h\nVendredi: 9h-18h\nSamedi: 10h-17h\nDimanche: Fermé\n\n(Informations de démonstration)`;
    }
    return `Je comprends que vous demandez: "${query}"\n\nÀ la Bibliothèque Municipale, je peux vous aider avec: ...`;
  }

  private containsAny(query: string, keywords: string[]): boolean {
    return keywords.some(keyword => query.includes(keyword));
  }

  private mergeWithDefaults(data: Partial<OrgSettings>): OrgSettings {
    try {
      const contact = data.Contact || {};
      const openingHours = data.OpeningHours || {};
      const theme = data.Theme || {};

      const result: OrgSettings = {
        ...defaultOrgSettings,
        ...data,
        Contact: {
          ...defaultOrgSettings.Contact,
          ...contact
        },
        OpeningHours: {
          ...defaultOrgSettings.OpeningHours,
          ...openingHours
        },
        Theme: {
          ...defaultOrgSettings.Theme,
          ...theme
        },
        Address: (data.Address ?? defaultOrgSettings.Address),
        LateReturnPenalties: Array.isArray(data.LateReturnPenalties) ? data.LateReturnPenalties : defaultOrgSettings.LateReturnPenalties,
        Logo: data.Logo ?? defaultOrgSettings.Logo,
        MaximumSimultaneousLoans: typeof data.MaximumSimultaneousLoans === 'number' ? data.MaximumSimultaneousLoans : defaultOrgSettings.MaximumSimultaneousLoans,
        Name: data.Name ?? defaultOrgSettings.Name,
        SpecificBorrowingRules: Array.isArray(data.SpecificBorrowingRules) ? data.SpecificBorrowingRules : defaultOrgSettings.SpecificBorrowingRules
      };

      return result;
    } catch (error) {
      console.error('Error merging with defaults:', error);
      return defaultOrgSettings;
    }
  }
  // For searching for books without author name
  public async checkBookAvailabilityDirect(title: string, author?: string): Promise<string> {
  try {
    const availability = await this.checkBookAvailability(title, author);
    return this.formatBookAvailability(availability);
  } catch (error) {
    console.error('[AssistantApi] Error in checkBookAvailabilityDirect:', error);
    return `❌ Impossible de vérifier la disponibilité du livre "${title}". Veuillez réessayer ou contacter la bibliothèque.`;
  }
}
}