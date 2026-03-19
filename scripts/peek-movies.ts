#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface Movie {
  title: string;
  year: string | null;
  link: string;
  imageUrl: string;
  stars: string | null;
  rating: number | null;
  date: string | null;
}

interface MovieCache {
  fetchedAt: string;
  movies: Movie[];
}

const CACHE_PATH = path.join(__dirname, '..', 'data', 'letterboxd-cache.json');

function main(): void {
  if (!fs.existsSync(CACHE_PATH)) {
    console.error('No cache found. Run `npm run fetch-movies` first.');
    process.exit(1);
  }

  const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
  const cache: MovieCache = JSON.parse(raw);

  console.log(`Cache from: ${new Date(cache.fetchedAt).toLocaleString()}`);
  console.log(`${cache.movies.length} movie(s):\n`);

  cache.movies.forEach((m, i) => {
    const parts: string[] = [`${i + 1}. ${m.title}`];
    if (m.year) parts.push(`(${m.year})`);
    if (m.stars) parts.push(m.stars);
    if (m.date) parts.push(`— watched ${m.date}`);
    console.log(parts.join(' '));
    console.log(`   ${m.link}`);
  });
}

main();
