#!/usr/bin/env node

import dotenv from 'dotenv';
import pg from 'pg';
import fetch from 'node-fetch';

dotenv.config();
const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'flagfootball_dev',
  user: process.env.DB_USER || 'aljosaursakous',
  password: process.env.DB_PASSWORD || ''
};

// API endpoints for sports medicine research
const API_ENDPOINTS = {
  bmjOpenSem: 'https://bmjopensem.bmj.com/items.json',
  bjsm: 'https://bjsm.bmj.com/items.json',
  mdpiSports: 'https://api.mdpi.com/v5/articles?journal=sports',
  jssm: 'https://www.jssm.org/oai/oai.php',
  pubmed: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
  crossref: 'https://api.crossref.org/works',
  europePMC: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search'
};

// API keys (if available)
const API_KEYS = {
  pubmed: process.env.PUBMED_API_KEY || '',
  mdpi: process.env.MDPI_API_KEY || ''
};

async function integrateSportsMedicineAPIs() {
  let db;
  
  try {
    console.log('🔌 Connecting to database...');
    db = new Pool(dbConfig);
    await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Create API integration tables
    await createAPIIntegrationTables(db);
    
    // Fetch data from BMJ Open Sport & Exercise Medicine
    await fetchBMJOpenSemData(db);
    
    // Fetch data from MDPI Sports
    await fetchMDPISportsData(db);
    
    // Fetch data from PubMed
    await fetchPubMedData(db);
    
    // Fetch data from Crossref
    await fetchCrossrefData(db);
    
    // Fetch data from Europe PMC
    await fetchEuropePMCData(db);
    
    console.log('🎉 Sports medicine API integration completed successfully!');
    
  } catch (error) {
    console.error('💥 API integration failed:', error);
    process.exit(1);
  } finally {
    if (db) {
      await db.end();
      console.log('🔌 Database connection closed');
    }
  }
}

async function createAPIIntegrationTables(db) {
  console.log('📋 Creating API integration tables...');
  
  // API sources table
  await db.query(`
    CREATE TABLE IF NOT EXISTS api_sources (
      id SERIAL PRIMARY KEY,
      source_name VARCHAR(100) NOT NULL,
      api_endpoint TEXT,
      description TEXT,
      access_type VARCHAR(50), -- 'open', 'restricted', 'subscription'
      rate_limit_info TEXT,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // API articles table
  await db.query(`
    CREATE TABLE IF NOT EXISTS api_articles (
      id SERIAL PRIMARY KEY,
      source_id INTEGER REFERENCES api_sources(id),
      external_id VARCHAR(255),
      title TEXT NOT NULL,
      authors TEXT[],
      abstract TEXT,
      keywords TEXT[],
      publication_date DATE,
      doi VARCHAR(255),
      journal_name VARCHAR(255),
      research_focus VARCHAR(100),
      methodology TEXT,
      key_findings TEXT[],
      practical_implications TEXT[],
      full_text_url TEXT,
      api_metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // API search queries table
  await db.query(`
    CREATE TABLE IF NOT EXISTS api_search_queries (
      id SERIAL PRIMARY KEY,
      source_id INTEGER REFERENCES api_sources(id),
      query_text TEXT NOT NULL,
      results_count INTEGER,
      search_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      query_parameters JSONB
    )
  `);
  
  console.log('✅ API integration tables created');
}

async function fetchBMJOpenSemData(db) {
  console.log('📚 Fetching BMJ Open Sport & Exercise Medicine data...');
  
  try {
    // Insert source information
    await db.query(`
      INSERT INTO api_sources (source_name, api_endpoint, description, access_type, rate_limit_info)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (source_name) DO NOTHING
    `, [
      'BMJ Open Sport & Exercise Medicine',
      API_ENDPOINTS.bmjOpenSem,
      'Open access sports medicine journal with JSON API for article metadata',
      'open',
      '~10 requests/second'
    ]);
    
    const sourceResult = await db.query('SELECT id FROM api_sources WHERE source_name = $1', ['BMJ Open Sport & Exercise Medicine']);
    const sourceId = sourceResult.rows[0].id;
    
    // Fetch articles from BMJ API
    const response = await fetch(API_ENDPOINTS.bmjOpenSem);
    const data = await response.json();
    
    if (data && data.items) {
      let count = 0;
      for (const item of data.items.slice(0, 10)) { // Limit to 10 for demo
        if (item.title && item.title.includes('nutrition')) {
          await db.query(`
            INSERT INTO api_articles 
            (source_id, external_id, title, authors, abstract, keywords, publication_date, doi, journal_name, research_focus, api_metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (doi) DO NOTHING
          `, [
            sourceId,
            item.id || null,
            item.title || 'Untitled',
            item.authors || [],
            item.abstract || null,
            item.keywords || [],
            item.publication_date ? new Date(item.publication_date) : null,
            item.doi || null,
            'BMJ Open Sport & Exercise Medicine',
            'sports_medicine',
            JSON.stringify(item)
          ]);
          count++;
        }
      }
      console.log(`✅ Fetched ${count} nutrition-related articles from BMJ Open Sport & Exercise Medicine`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching BMJ data:', error.message);
  }
}

async function fetchMDPISportsData(db) {
  console.log('📚 Fetching MDPI Sports data...');
  
  try {
    // Insert source information
    await db.query(`
      INSERT INTO api_sources (source_name, api_endpoint, description, access_type, rate_limit_info)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (source_name) DO NOTHING
    `, [
      'MDPI Sports',
      API_ENDPOINTS.mdpiSports,
      'Open access sports journal with REST API for articles and datasets',
      'open',
      '1,000 calls/day without token'
    ]);
    
    const sourceResult = await db.query('SELECT id FROM api_sources WHERE source_name = $1', ['MDPI Sports']);
    const sourceId = sourceResult.rows[0].id;
    
    // Fetch articles from MDPI API
    const response = await fetch(API_ENDPOINTS.mdpiSports);
    const data = await response.json();
    
    if (data && data.data) {
      let count = 0;
      for (const article of data.data.slice(0, 10)) { // Limit to 10 for demo
        if (article.title && (article.title.includes('nutrition') || article.title.includes('supplement'))) {
          await db.query(`
            INSERT INTO api_articles 
            (source_id, external_id, title, authors, abstract, keywords, publication_date, doi, journal_name, research_focus, api_metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (doi) DO NOTHING
          `, [
            sourceId,
            article.id || null,
            article.title || 'Untitled',
            article.authors ? article.authors.split(',') : [],
            article.abstract || null,
            article.keywords ? article.keywords.split(',') : [],
            article.publication_date ? new Date(article.publication_date) : null,
            article.doi || null,
            'Sports (MDPI)',
            'sports_nutrition',
            JSON.stringify(article)
          ]);
          count++;
        }
      }
      console.log(`✅ Fetched ${count} nutrition-related articles from MDPI Sports`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching MDPI data:', error.message);
  }
}

async function fetchPubMedData(db) {
  console.log('📚 Fetching PubMed data...');
  
  try {
    // Insert source information
    await db.query(`
      INSERT INTO api_sources (source_name, api_endpoint, description, access_type, rate_limit_info)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (source_name) DO NOTHING
    `, [
      'PubMed',
      API_ENDPOINTS.pubmed,
      'Comprehensive biomedical literature database with E-utilities API',
      'open',
      '3 calls/second without key, 10/s with API key'
    ]);
    
    const sourceResult = await db.query('SELECT id FROM api_sources WHERE source_name = $1', ['PubMed']);
    const sourceId = sourceResult.rows[0].id;
    
    // Search for sports nutrition articles
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: 'sports nutrition[Title/Abstract] AND ("2020"[Date - Publication] : "2025"[Date - Publication])',
      rettype: 'json',
      retmax: '10'
    });
    
    if (API_KEYS.pubmed) {
      searchParams.append('api_key', API_KEYS.pubmed);
    }
    
    const response = await fetch(`${API_ENDPOINTS.pubmed}?${searchParams}`);
    const data = await response.json();
    
    if (data && data.esearchresult && data.esearchresult.idlist) {
      let count = 0;
      for (const pmid of data.esearchresult.idlist) {
        // Fetch article details
        const fetchParams = new URLSearchParams({
          db: 'pubmed',
          id: pmid,
          rettype: 'json',
          retmode: 'json'
        });
        
        if (API_KEYS.pubmed) {
          fetchParams.append('api_key', API_KEYS.pubmed);
        }
        
        const articleResponse = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${fetchParams}`);
        const articleData = await articleResponse.json();
        
        if (articleData && articleData.result && articleData.result[pmid]) {
          const article = articleData.result[pmid];
          await db.query(`
            INSERT INTO api_articles 
            (source_id, external_id, title, authors, abstract, keywords, publication_date, doi, journal_name, research_focus, api_metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (doi) DO NOTHING
          `, [
            sourceId,
            pmid,
            article.title || 'Untitled',
            article.authors ? article.authors.map(a => a.name) : [],
            article.abstract || null,
            article.mesh_terms || [],
            article.pubdate ? new Date(article.pubdate) : null,
            article.elocationid || null,
            article.fulljournalname || 'PubMed',
            'sports_nutrition',
            JSON.stringify(article)
          ]);
          count++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      console.log(`✅ Fetched ${count} nutrition-related articles from PubMed`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching PubMed data:', error.message);
  }
}

async function fetchCrossrefData(db) {
  console.log('📚 Fetching Crossref data...');
  
  try {
    // Insert source information
    await db.query(`
      INSERT INTO api_sources (source_name, api_endpoint, description, access_type, rate_limit_info)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (source_name) DO NOTHING
    `, [
      'Crossref',
      API_ENDPOINTS.crossref,
      'DOI registration agency with comprehensive article metadata',
      'open',
      'No strict rate limit, but be respectful'
    ]);
    
    const sourceResult = await db.query('SELECT id FROM api_sources WHERE source_name = $1', ['Crossref']);
    const sourceId = sourceResult.rows[0].id;
    
    // Search for sports nutrition articles
    const searchParams = new URLSearchParams({
      query: 'sports nutrition',
      rows: '10',
      select: 'DOI,title,author,abstract,published-print,container-title'
    });
    
    const response = await fetch(`${API_ENDPOINTS.crossref}?${searchParams}`);
    const data = await response.json();
    
    if (data && data.message && data.message.items) {
      let count = 0;
      for (const item of data.message.items) {
        if (item.title && item.title[0] && item.title[0].includes('nutrition')) {
          await db.query(`
            INSERT INTO api_articles 
            (source_id, external_id, title, authors, abstract, keywords, publication_date, doi, journal_name, research_focus, api_metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (doi) DO NOTHING
          `, [
            sourceId,
            item.DOI || null,
            item.title ? item.title[0] : 'Untitled',
            item.author ? item.author.map(a => `${a.given} ${a.family}`) : [],
            item.abstract || null,
            [],
            item['published-print'] ? new Date(item['published-print']['date-parts'][0].join('-')) : null,
            item.DOI || null,
            item['container-title'] ? item['container-title'][0] : 'Unknown Journal',
            'sports_nutrition',
            JSON.stringify(item)
          ]);
          count++;
        }
      }
      console.log(`✅ Fetched ${count} nutrition-related articles from Crossref`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching Crossref data:', error.message);
  }
}

async function fetchEuropePMCData(db) {
  console.log('📚 Fetching Europe PMC data...');
  
  try {
    // Insert source information
    await db.query(`
      INSERT INTO api_sources (source_name, api_endpoint, description, access_type, rate_limit_info)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (source_name) DO NOTHING
    `, [
      'Europe PMC',
      API_ENDPOINTS.europePMC,
      'European PubMed Central with enhanced full-text access',
      'open',
      'No strict rate limit'
    ]);
    
    const sourceResult = await db.query('SELECT id FROM api_sources WHERE source_name = $1', ['Europe PMC']);
    const sourceId = sourceResult.rows[0].id;
    
    // Search for sports nutrition articles
    const searchParams = new URLSearchParams({
      query: 'sports nutrition',
      format: 'json',
      size: '10'
    });
    
    const response = await fetch(`${API_ENDPOINTS.europePMC}?${searchParams}`);
    const data = await response.json();
    
    if (data && data.resultList && data.resultList.result) {
      let count = 0;
      for (const article of data.resultList.result) {
        if (article.title && article.title.includes('nutrition')) {
          await db.query(`
            INSERT INTO api_articles 
            (source_id, external_id, title, authors, abstract, keywords, publication_date, doi, journal_name, research_focus, api_metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (doi) DO NOTHING
          `, [
            sourceId,
            article.id || null,
            article.title || 'Untitled',
            article.authorString ? article.authorString.split(',') : [],
            article.abstract || null,
            [],
            article.firstPublicationDate ? new Date(article.firstPublicationDate) : null,
            article.doi || null,
            article.journalTitle || 'Europe PMC',
            'sports_nutrition',
            JSON.stringify(article)
          ]);
          count++;
        }
      }
      console.log(`✅ Fetched ${count} nutrition-related articles from Europe PMC`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching Europe PMC data:', error.message);
  }
}

// Run the integration
integrateSportsMedicineAPIs().catch(console.error); 