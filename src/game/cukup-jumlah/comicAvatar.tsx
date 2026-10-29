import React from "react";
import type { CandidateProfile } from "./types";
import { VoxelSinglePreview } from "./voxel/VoxelSinglePreview";

interface ComicAvatarProps {
  profile: CandidateProfile;
  size?: number;
  isBouncing?: boolean;
  mood?: "normal" | "happy" | "sweat" | "shout";
}

export function ComicAvatar({
  profile,
  size = 180,
  isBouncing = true,
  mood = "normal",
}: ComicAvatarProps) {
  return (
    <div className="relative inline-block">
      <VoxelSinglePreview profile={profile} size={size} isBouncing={isBouncing} className="rounded-2xl" />
      {mood === "sweat" && (
        <span className="absolute -top-1 -right-1 text-2xl animate-pulse pointer-events-none">💧</span>
      )}
      {mood === "shout" && (
        <span className="absolute -top-2 -right-2 text-2xl animate-bounce pointer-events-none">📢</span>
      )}
    </div>
  );
}
