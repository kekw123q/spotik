import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
    onSearch: (query: string) => void;
    isLoading?: boolean;
}

export const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    useEffect(() => {
        onSearch(debouncedQuery);
    }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="relative w-full max-w-2xl">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </div>
            <Input
                type="text"
                placeholder="Search for tracks, artists, or albums..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-12 text-lg rounded-full bg-card/50 backdrop-blur-sm border-muted"
            />
        </div>
    );
};