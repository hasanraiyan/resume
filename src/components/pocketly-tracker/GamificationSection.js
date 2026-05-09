'use client';

import { useMoney } from '@/context/MoneyContext';
import { Flame, Trophy, ShieldCheck, PiggyBank, Star } from 'lucide-react';

const achievementIcons = {
  ShieldCheck: ShieldCheck,
  PiggyBank: PiggyBank,
  Trophy: Trophy,
};

export default function GamificationSection() {
  const { savingsStreak, achievements } = useMoney();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Streak Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1f644e] to-[#2d8a6e] p-6 text-white shadow-lg">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#a8d5c8]">
              Savings Streak
            </p>
            <h3 className="mt-1 text-3xl font-black">{savingsStreak} Days</h3>
            <p className="mt-1 text-xs font-medium text-[#a8d5c8]">
              {savingsStreak > 0
                ? "You're on fire! Keep staying under budget."
                : 'Start your streak today by staying within your daily limit.'}
            </p>
          </div>
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md ${savingsStreak > 0 ? 'animate-bounce' : ''}`}
          >
            <Flame
              className={`h-10 w-10 ${savingsStreak > 0 ? 'text-orange-400' : 'text-white/40'}`}
              fill={savingsStreak > 0 ? 'currentColor' : 'none'}
            />
          </div>
        </div>

        {/* Background Decorative Element */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Achievements Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1e3a34] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#f59e0b]" />
            Your Achievements
          </h3>
          <span className="text-[10px] font-bold text-[#7c8e88] bg-[#f0f5f2] px-2 py-0.5 rounded-full">
            {achievements.length} Unlocked
          </span>
        </div>

        {achievements.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#e5e3d8] p-8 text-center bg-white/50">
            <Star className="mx-auto h-8 w-8 text-[#e5e3d8] mb-2" />
            <p className="text-xs font-bold text-[#7c8e88]">
              No achievements yet. Keep tracking to earn badges!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {achievements.map((achievement) => {
              const Icon = achievementIcons[achievement.icon] || Star;
              return (
                <div
                  key={achievement.id}
                  className="group relative overflow-hidden rounded-2xl border border-[#e5e3d8] bg-white p-4 transition-all hover:shadow-md hover:border-[#1f644e]/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f5f2] text-[#1f644e] group-hover:bg-[#1f644e] group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1e3a34]">{achievement.title}</p>
                      <p className="text-[10px] font-medium text-[#7c8e88] leading-tight">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
