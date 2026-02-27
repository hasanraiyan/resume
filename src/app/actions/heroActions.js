/**
 * @fileoverview Server actions for the HeroSection model.
 * Centralises all hero-related DB access so that layout.js and API routes
 * have a single, traceable, error-safe place to call.
 */

'use server';

import dbConnect from '@/lib/dbConnect';
import HeroSection from '@/models/HeroSection';
import { serializeForClient } from '@/lib/serialize';
import { revalidatePath } from 'next/cache';

/**
 * Fetches the active HeroSection document and serialises it for client use.
 *
 * - Called by `layout.js` to populate SiteContext on every request.
 * - Falls back to `HeroSection.seedDefault()` if no active document exists.
 * - Returns `null` (with a console warning) when the DB is unreachable so
 *   that a connection failure never prevents the page from rendering.
 *
 * @returns {Promise<Object|null>} Serialised hero data, or null on error.
 */
export async function getHeroData() {
  try {
    await dbConnect();

    let heroData = await HeroSection.findOne({ isActive: true }).lean();

    if (!heroData) {
      heroData = await HeroSection.seedDefault();
    }

    return serializeForClient(heroData);
  } catch (error) {
    console.error('[getHeroData] Failed to fetch hero section from DB:', error);
    // Return null so layout.js can fall back to default values instead of
    // throwing and breaking the entire page render.
    return null;
  }
}
