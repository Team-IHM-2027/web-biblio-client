export interface OpeningHours {
    open: string;
    close: string;
}

export interface Contact {
    Email: string;
    Phone: string;
    WhatsApp: string;
    Facebook: string;
    Instagram: string;
}

export interface Theme {
    Primary: string;
    Secondary: string;
}

export interface OrgSettings {
    Address: string;
    Contact: Contact;
    MaintenanceMode?: boolean;
    LateReturnPenalties: string[];
    Logo: string;
    MaximumSimultaneousLoans: number;
    Name: string;
    OpeningHours: {
        Monday: string;
        Tuesday: string;
        Wednesday: string;
        Thursday: string;
        Friday: string;
        Saturday: string;
        Sunday: string;
    };
    SpecificBorrowingRules: string[];
    Theme: Theme;
}

export interface AppSettings {
    AppVersion: number;
    DefaultLoanDuration: number;
    GlobalLimits: number;
    MaintenanceMode: boolean;
}
