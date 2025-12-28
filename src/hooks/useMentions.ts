import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const useMentions = () => {
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loadingMentions, setLoadingMentions] = useState(false);

    useEffect(() => {
        if (showMentions) {
            setLoadingMentions(true);
            // Even with empty query, we want to show some users (limited by match)
            api.searchUsers(mentionQuery).then(({ data }) => {
                if (data) setSuggestions(data as any[]);
                setLoadingMentions(false);
            });
        } else {
            setSuggestions([]);
        }
    }, [mentionQuery, showMentions]);

    const handleInput = (text: string, cursorPosition: number) => {
        const textBeforeCursor = text.substring(0, cursorPosition);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            setShowMentions(true);
            setMentionQuery(mentionMatch[1]);
        } else {
            setShowMentions(false);
        }
    };

    const applyMention = (fullText: string, username: string, query: string) => {
        const cursorPosition = fullText.lastIndexOf('@' + query);
        const textBefore = fullText.substring(0, cursorPosition);
        const textAfter = fullText.substring(cursorPosition + query.length + 1);

        const newText = textBefore + '@' + username + ' ' + textAfter;
        setShowMentions(false);
        return newText;
    };

    return {
        showMentions,
        suggestions,
        loadingMentions,
        mentionQuery,
        handleInput,
        applyMention,
        setShowMentions
    };
};
