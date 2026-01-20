// src/components/common/MessageBubble.tsx
import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { Message } from '../../types/chat';
import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MessageBubbleProps {
	message: Message;
	isSender: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSender }) => {
	// const bubbleClasses = isSender
	// 	? 'bg-primary text-white self-end rounded-br-none'
	// 	: 'bg-secondary-200 text-gray-800 self-start rounded-bl-none';

	const messageDate = message.heure instanceof Timestamp ? message.heure.toDate() :
		(message.heure as any)?.toDate ? (message.heure as any).toDate() :
			new Date(message.heure as any);
	const timeString = format(messageDate, 'HH:mm', { locale: fr });

	const isBot = message.senderName?.includes('Assistant') || message.senderName?.includes('Bibliothèque');

	return (
		<div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
			<div className={`flex flex-col max-w-xs lg:max-w-md ${isSender ? 'items-end' : 'items-start'}`}>
				{/* Sender Name (for non-sender or bot messages) */}
				{!isSender && (
					<p className="text-xs font-medium text-gray-600 mb-1 px-4">
						{message.senderName || 'Support'}
					</p>
				)}

				{/* Message Bubble */}
				<div
					className={`rounded-2xl px-4 py-3 break-words ${isSender
						? 'bg-blue-500 text-white rounded-br-none'
						: isBot
							? 'bg-gradient-to-r from-amber-50 to-orange-50 text-gray-800 border border-orange-200 rounded-bl-none'
							: 'bg-gray-200 text-gray-800 rounded-bl-none'
						}`}
				>
					<p className="text-sm leading-relaxed whitespace-pre-wrap">{message.texte}</p>
				</div>

				{/* Message Footer (time and read status) */}
				<div className={`flex items-center space-x-1 mt-1 px-4 text-xs ${isSender ? 'text-gray-500' : 'text-gray-600'
					}`}>
					<span>{timeString}</span>
					{isSender && (
						message.lu ? (
							<CheckCheck className="w-3 h-3 text-blue-500" />
						) : (
							<Check className="w-3 h-3 text-gray-400" />
						)
					)}
				</div>
			</div>
		</div>
	);
};

export default MessageBubble;

