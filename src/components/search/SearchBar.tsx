import React, { useState, useCallback, useRef, useEffect } from 'react';
import './SearchBar.css';

interface SearchResult {
    id: string;
    type: 'itinerary' | 'place' | 'trail';
    title: string;
    subtitle?: string;
    meta?: string;
    data?: any;
}

interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => Promise<SearchResult[]> | SearchResult[];
    onSelect: (result: SearchResult) => void;
    className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = '搜尋行程或景點...',
    onSearch,
    onSelect,
    className = '',
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced search
    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const searchResults = await onSearch(searchQuery);
            setResults(searchResults);
            setIsOpen(searchResults.length > 0);
            setSelectedIndex(-1);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [onSearch]);

    // Handle input change with debounce
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            handleSearch(value);
        }, 300);
    }, [handleSearch]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    onSelect(results[selectedIndex]);
                    setIsOpen(false);
                    setQuery('');
                }
                break;
            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    }, [isOpen, results, selectedIndex, onSelect]);

    // Handle result click
    const handleResultClick = useCallback((result: SearchResult) => {
        onSelect(result);
        setIsOpen(false);
        setQuery('');
    }, [onSelect]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Clean up debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const getTypeIcon = (type: SearchResult['type']) => {
        switch (type) {
            case 'itinerary':
                return '';
            case 'place':
                return '';
            case 'trail':
                return '';
            default:
                return '';
        }
    };

    const getTypeLabel = (type: SearchResult['type']) => {
        switch (type) {
            case 'itinerary':
                return '行程';
            case 'place':
                return '景點';
            case 'trail':
                return '路線';
            default:
                return '';
        }
    };

    return (
        <div className={`search-bar ${className}`} ref={containerRef}>
            <div className="search-bar__input-wrapper">
                <span className="search-bar__icon">Search</span>
                <input
                    ref={inputRef}
                    type="text"
                    className="search-bar__input"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query && results.length > 0 && setIsOpen(true)}
                />
                {isLoading && (
                    <span className="search-bar__loading">
                        <span className="search-bar__spinner"></span>
                    </span>
                )}
                {query && !isLoading && (
                    <button
                        className="search-bar__clear"
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            setIsOpen(false);
                            inputRef.current?.focus();
                        }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="search-bar__results">
                    {results.map((result, index) => (
                        <div
                            key={result.id}
                            className={`search-bar__result ${selectedIndex === index ? 'selected' : ''}`}
                            onClick={() => handleResultClick(result)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <span className="search-bar__result-icon">
                                {getTypeIcon(result.type)}
                            </span>
                            <div className="search-bar__result-content">
                                <div className="search-bar__result-title">{result.title}</div>
                                {result.subtitle && (
                                    <div className="search-bar__result-subtitle">{result.subtitle}</div>
                                )}
                            </div>
                            <div className="search-bar__result-meta">
                                <span className="search-bar__result-type">{getTypeLabel(result.type)}</span>
                                {result.meta && <span className="search-bar__result-info">{result.meta}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isOpen && query && results.length === 0 && !isLoading && (
                <div className="search-bar__results">
                    <div className="search-bar__no-results">
                        <p>找不到符合「{query}」的結果</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
