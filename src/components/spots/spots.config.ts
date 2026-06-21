export interface SpotConfig {
  id: number;
  trackId: string;
  position: [number, number, number];
  color: string;
}

// Replace each trackId with your actual Spotify track IDs.
// To find a track ID: open the song on Spotify → right-click → Share → Copy link
// The ID is the part after /track/ in the URL.
// Example: https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC → ID is "4uLU6hMCjMI75M1A2tKUQC"
export const SPOTS: SpotConfig[] = [
  { id: 1, trackId: '4uLU6hMCjMI75M1A2tKUQC', position: [80,   0,  30],  color: '#ffaa33' },
  { id: 2, trackId: '0VjIjW4GlUZAMYd2vXMwbk', position: [-60,  0,  90],  color: '#ff6b8a' },
  { id: 3, trackId: '3n3Ppam7vgaVa1iaRUc9Lp', position: [-100, 0, -20],  color: '#9b6bff' },
  { id: 4, trackId: '1301WleyT98MSxVHPZCA6M', position: [-40,  0, -100], color: '#ff7f5c' },
  { id: 5, trackId: '2takcwgfvGKVT8vNHlB6Px', position: [50,   0, -110], color: '#4ecdc4' },
  { id: 6, trackId: '7qiZfU4dY1lsylvNEJsRj3', position: [110,  0, -50],  color: '#fff5e0' },
];

export const PROXIMITY_ENTER = 18;
export const PROXIMITY_EXIT = 22;
