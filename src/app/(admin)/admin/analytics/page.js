'use client';

import { useState, useEffect } from 'react';

const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        if (!res.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const jsonData = await res.json();
        setData(jsonData);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!data) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Total Page Views</h2>
          <p className="text-3xl">{data.totalPageViews}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Unique Visitors</h2>
          <p className="text-3xl">{data.uniqueVisitors}</p>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Page Views by Path</h2>
        <ul className="bg-white p-4 rounded-lg shadow mt-2">
          {data.pageViewsByPath.map((item) => (
            <li key={item._id} className="flex justify-between py-1">
              <span>{item._id}</span>
              <span>{item.count}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Events by Type</h2>
        <ul className="bg-white p-4 rounded-lg shadow mt-2">
          {data.eventsByType.map((item) => (
            <li key={item._id} className="flex justify-between py-1">
              <span>{item._id}</span>
              <span>{item.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;