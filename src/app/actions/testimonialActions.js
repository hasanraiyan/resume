'use server';

import dbConnect from '@/lib/dbConnect';
import Testimonial from '@/models/Testimonial';
import TestimonialSection from '@/models/TestimonialSection';
import { serializeForClient } from '@/lib/serialize';

export async function getTestimonialsData() {
  await dbConnect();
  try {
    const [section, items] = await Promise.all([
      TestimonialSection.getSettings(),
      Testimonial.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).lean(),
    ]);

    return serializeForClient({
      section,
      testimonials: items,
    });
  } catch (error) {
    console.error('Error fetching testimonials data:', error);
    return null;
  }
}
