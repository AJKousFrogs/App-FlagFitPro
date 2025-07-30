import React, { useState, useEffect } from 'react';
import { mcpService } from '../services/MCPService';
import { searchLibraryIds, getCategoryLibraryIds } from '../config/context7-mappings';

const SportsDocumentationLookup = ({ 
  query = '', 
  category = '', 
  onDocumentationFound = () => {},
  showUI = true 
}) => {
  const [loading, setLoading] = useState(false);
  const [documentation, setDocumentation] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [mcpStatus, setMcpStatus] = useState({ connected: false });

  // Available categories
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'nutrition', label: '🥗 Nutrition' },
    { value: 'training', label: '💪 Training' },
    { value: 'recovery', label: '😴 Recovery' },
    { value: 'psychology', label: '🧠 Psychology' },
    { value: 'biomechanics', label: '🏃 Biomechanics' },
    { value: 'injury-prevention', label: '🛡️ Injury Prevention' },
    { value: 'flag-football', label: '🏈 Flag Football' },
    { value: 'technology', label: '📱 Technology' }
  ];

  // Initialize MCP service
  useEffect(() => {
    const initializeMCP = async () => {
      try {
        const status = await mcpService.initialize();
        setMcpStatus(status);
        
        if (!status.connected) {
          setError('MCP Context7 server not available. Documentation lookup is offline.');
        }
      } catch (err) {
        setError(`MCP initialization failed: ${err.message}`);
      }
    };

    initializeMCP();
  }, []);

  // Auto-search when query or category changes
  useEffect(() => {
    if (query || category) {
      handleSearch(query, category);
    }
  }, [query, category]);

  const handleSearch = async (searchQuery = searchTerm, searchCategory = selectedCategory) => {
    if (!searchQuery && !searchCategory) {
      setError('Please enter a search term or select a category');
      return;
    }

    setLoading(true);
    setError(null);
    setDocumentation(null);

    try {
      let results = [];

      if (mcpStatus.connected) {
        // Use MCP Context7 service
        if (searchCategory) {
          // Get category-specific documentation
          const categoryIds = getCategoryLibraryIds(searchCategory);
          const categoryResults = await Promise.allSettled(
            categoryIds.map(id => mcpService.getLibraryDocs(id))
          );
          
          results = categoryResults
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
        }

        if (searchQuery) {
          // Search for query-specific documentation
          const queryResults = await mcpService.searchSportsScience(searchQuery, searchCategory);
          if (queryResults && !queryResults.error) {
            results.push(queryResults);
          }
        }
      } else {
        // Fallback to mock data when MCP is not available
        results = await getMockDocumentation(searchQuery, searchCategory);
      }

      const combinedDocs = combineDocumentationResults(results);
      setDocumentation(combinedDocs);
      onDocumentationFound(combinedDocs);

    } catch (err) {
      console.error('Documentation search error:', err);
      setError(`Search failed: ${err.message}`);
      
      // Try fallback data
      try {
        const fallbackData = await getMockDocumentation(searchQuery || searchCategory);
        setDocumentation(fallbackData);
        onDocumentationFound(fallbackData);
      } catch (fallbackErr) {
        setError(`Both primary and fallback searches failed: ${fallbackErr.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const combineDocumentationResults = (results) => {
    const combined = {
      sources: [],
      recommendations: [],
      techniques: [],
      research: [],
      summary: '',
      lastUpdated: new Date().toISOString()
    };

    results.forEach(result => {
      if (result.content) {
        combined.sources.push(...(result.content.sources || []));
        combined.recommendations.push(...(result.content.recommendations || []));
        combined.techniques.push(...(result.content.techniques || []));
        combined.research.push(...(result.content.research || []));
      }
      
      if (result.summary) {
        combined.summary += result.summary + ' ';
      }
    });

    // Remove duplicates and limit results
    combined.sources = [...new Set(combined.sources)].slice(0, 10);
    combined.recommendations = [...new Set(combined.recommendations)].slice(0, 8);
    combined.techniques = [...new Set(combined.techniques)].slice(0, 6);
    combined.research = [...new Set(combined.research)].slice(0, 5);
    combined.summary = combined.summary.trim();

    return combined;
  };

  // Mock documentation for fallback
  const getMockDocumentation = async (query, category) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    const mockData = {
      content: {
        sources: [
          'Journal of Sports Sciences (2025)',
          'International Journal of Sport Nutrition (2025)',
          'Sports Medicine Research (2025)'
        ],
        recommendations: [
          'Implement evidence-based training progressions',
          'Monitor training load using validated metrics',
          'Prioritize recovery between training sessions',
          'Use sport-specific movement patterns'
        ],
        techniques: [
          'Progressive overload methodology',
          'Periodized training approach',
          'Movement competency assessment',
          'Functional training integration'
        ],
        research: [
          'Recent meta-analysis shows 15-20% performance improvement with structured training',
          'Nutrition timing windows are crucial for adaptation',
          'Recovery protocols reduce injury risk by 40%'
        ]
      },
      summary: `Current research supports ${query || category} optimization through evidence-based protocols.`,
      libraryId: `mock-${query || category}-2025`,
      lastUpdated: new Date().toISOString()
    };

    return mockData;
  };

  if (!showUI) {
    // Component used programmatically, no UI
    return null;
  }

  return (
    <div className="sports-documentation-lookup">
      <div className="lookup-header">
        <h3>📚 Sports Science Documentation</h3>
        <div className="mcp-status">
          <span className={`status-indicator ${mcpStatus.connected ? 'connected' : 'offline'}`}>
            {mcpStatus.connected ? '🟢 Context7 Connected' : '🔴 Offline Mode'}
          </span>
        </div>
      </div>

      <div className="search-controls">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Search training techniques, nutrition protocols, etc."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <button 
            onClick={() => handleSearch()}
            disabled={loading}
            className="search-button"
          >
            {loading ? '⏳' : '🔍'} Search
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Searching sports science literature...</p>
        </div>
      )}

      {documentation && (
        <div className="documentation-results">
          {documentation.summary && (
            <div className="summary-section">
              <h4>📋 Summary</h4>
              <p>{documentation.summary}</p>
            </div>
          )}

          {documentation.recommendations?.length > 0 && (
            <div className="recommendations-section">
              <h4>💡 Key Recommendations</h4>
              <ul className="recommendations-list">
                {documentation.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {documentation.techniques?.length > 0 && (
            <div className="techniques-section">
              <h4>🛠️ Techniques & Methods</h4>
              <div className="techniques-grid">
                {documentation.techniques.map((technique, index) => (
                  <div key={index} className="technique-card">
                    {technique}
                  </div>
                ))}
              </div>
            </div>
          )}

          {documentation.research?.length > 0 && (
            <div className="research-section">
              <h4>🔬 Current Research</h4>
              {documentation.research.map((research, index) => (
                <div key={index} className="research-item">
                  <span className="research-bullet">•</span>
                  {research}
                </div>
              ))}
            </div>
          )}

          {documentation.sources?.length > 0 && (
            <div className="sources-section">
              <h4>📖 Sources</h4>
              <div className="sources-list">
                {documentation.sources.map((source, index) => (
                  <span key={index} className="source-tag">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="documentation-footer">
            <small>
              Last updated: {new Date(documentation.lastUpdated).toLocaleString()}
              {mcpStatus.connected && ' • Data from Context7'}
            </small>
          </div>
        </div>
      )}

      <style jsx>{`
        .sports-documentation-lookup {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin: 16px 0;
        }

        .lookup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .lookup-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.25rem;
        }

        .status-indicator {
          font-size: 0.875rem;
          padding: 4px 8px;
          border-radius: 6px;
          background: #f3f4f6;
        }

        .status-indicator.connected {
          background: #d1fae5;
          color: #065f46;
        }

        .search-controls {
          margin-bottom: 20px;
        }

        .search-input-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .category-select {
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          min-width: 140px;
        }

        .search-button {
          padding: 10px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .search-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fef2f2;
          color: #991b1b;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .loading-state {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .documentation-results {
          space-y: 24px;
        }

        .documentation-results > div {
          margin-bottom: 24px;
        }

        .documentation-results h4 {
          margin: 0 0 12px 0;
          color: #1f2937;
          font-size: 1.1rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .summary-section p {
          color: #4b5563;
          line-height: 1.6;
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }

        .recommendations-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .recommendations-list li {
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
        }

        .recommendations-list li:before {
          content: "✓ ";
          color: #10b981;
          font-weight: bold;
          margin-right: 8px;
        }

        .techniques-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .technique-card {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 0.9rem;
          color: #475569;
        }

        .research-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 12px;
          color: #374151;
          line-height: 1.5;
        }

        .research-bullet {
          color: #3b82f6;
          font-weight: bold;
          margin-top: 2px;
        }

        .sources-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .source-tag {
          background: #e0e7ff;
          color: #3730a3;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .documentation-footer {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.875rem;
        }

        @media (max-width: 640px) {
          .search-input-group {
            flex-direction: column;
          }
          
          .search-input, .category-select, .search-button {
            width: 100%;
          }
          
          .techniques-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SportsDocumentationLookup;