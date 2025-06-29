// GitHub repository configuration
export const GITHUB_CONFIG = {
  repoUrl: "https://github.com/rohittcodes/data-alchemist",
  fallback: {
    stars: 0,
    message: "⭐ Star us!"
  }
}

// Helper to get the repository info from URL
export function getRepoInfo(url: string) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) {
    throw new Error('Invalid GitHub URL format')
  }
  return {
    owner: match[1],
    repo: match[2],
    apiUrl: `https://api.github.com/repos/${match[1]}/${match[2]}`
  }
}
