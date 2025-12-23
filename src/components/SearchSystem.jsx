import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

const SearchSystem = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const searchRef = useRef(null);

  // Backend Integration - Fetch recent searches and quick actions
  useEffect(() => {
    if (user?.token) {
      fetchRecentSearches();
      fetchQuickActions();
    }
  }, [user]);

  const fetchRecentSearches = async () => {
    if (!user?.token) return;

    try {
      const response = await fetch("/api/search/recent", {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentSearches(data.recentSearches);
      }
    } catch (error) {
      console.error("Error fetching recent searches:", error);
    }
  };

  const fetchQuickActions = async () => {
    if (!user?.token) return;

    try {
      const response = await fetch("/api/search/quick-actions", {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuickActions(data.quickActions);
      }
    } catch (error) {
      console.error("Error fetching quick actions:", error);
    }
  };

  // Backend Integration - Search functionality
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    if (!user?.token) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);

        // Save to recent searches
        saveRecentSearch(searchQuery);
      }
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Backend Integration - Save recent search
  const saveRecentSearch = async (searchQuery) => {
    if (!user?.token) return;

    try {
      await fetch("/api/search/recent", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      });
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };

  // Backend Integration - Execute quick action
  const executeQuickAction = async (action) => {
    if (!user?.token) return;

    try {
      const response = await fetch("/api/search/quick-action", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: action.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      }
    } catch (error) {
      console.error("Error executing quick action:", error);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    // Debounce search
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  // Minimal UI - Search bar with dropdown
  return (
    <div className="search-system">
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          placeholder="🔍 Search FlagFit Pro..."
          value={query}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          className="search-input"
          aria-label="Search"
        />
        <button type="submit" className="search-button" aria-label="Search">
          🔍
        </button>
      </form>

      {isOpen && (
        <div className="search-dropdown">
          {query === "" ? (
            // Show recent searches and quick actions when search is empty
            <div className="search-suggestions">
              <div className="recent-searches">
                <h4>Recent Searches:</h4>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(search.query);
                      performSearch(search.query);
                    }}
                    className="recent-search-item"
                  >
                    {search.query}
                  </button>
                ))}
              </div>

              <div className="quick-actions">
                <h4>Quick Actions:</h4>
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => executeQuickAction(action)}
                    className="quick-action-item"
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Show search results
            <div className="search-results">
              {isLoading ? (
                <div className="loading">Searching...</div>
              ) : results.length === 0 ? (
                <div className="no-results">No results found</div>
              ) : (
                results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      window.location.href = result.url;
                      setIsOpen(false);
                    }}
                    className="search-result-item"
                  >
                    <div className="result-icon">{result.icon}</div>
                    <div className="result-content">
                      <div className="result-title">{result.title}</div>
                      <div className="result-description">
                        {result.description}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSystem;
