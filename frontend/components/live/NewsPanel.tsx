'use client';

import React, { useEffect } from 'react';
import { getNews } from '@/lib/api';

interface NewsPanelProps {
  coin: string;
}

export default function NewsPanel({ coin }: NewsPanelProps) {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await getNews(coin);
        setNews(response);
      } catch (error) {
        console.error('Error fetching news:', error);
      }
    };

    fetchNews();
  }, [coin]);

  return (
    <div className="bg-gray-800 p-4 rounded">
      <h2>News</h2>
      <ul>
        {news.map((article, index) => (
          <li key={index}>
            <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
            <p>{article.timestamp.toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
