const fs = require('fs');
const path = require('path');

const USERNAME = 'HarryNguyen510';
const MAX_PROJECTS = 2;

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    'User-Agent': 'GitHub-Action-HarryNguyen510',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // Lấy danh sách repo sắp xếp theo ngày tạo mới nhất (sort=created, direction=desc)
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?sort=created&direction=desc&per_page=30`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch repos: ${res.status} ${res.statusText}`);
  }

  const repos = await res.json();

  // Lọc: Bỏ qua repo fork, repo đặc biệt trùng tên profile HarryNguyen510
  const filtered = repos.filter(
    (repo) => !repo.fork && repo.name.toLowerCase() !== USERNAME.toLowerCase()
  );

  const selected = filtered.slice(0, MAX_PROJECTS);
  console.log('Selected latest projects:', selected.map((r) => r.name));

  const cardsHtml = selected
    .map((repo) => {
      return `<a href="https://github.com/${USERNAME}/${repo.name}">\n  <img src="https://github-readme-stats.vercel.app/api/pin/?username=${USERNAME}&repo=${repo.name}&theme=tokyonight&hide_border=true" />\n</a>`;
    })
    .join('\n\n');

  const readmePath = path.join(__dirname, '..', '..', 'README.md');
  let readme = fs.readFileSync(readmePath, 'utf8');

  const startMarker = '<!-- RECENT_PROJECTS:START -->';
  const endMarker = '<!-- RECENT_PROJECTS:END -->';

  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found in README.md');
    process.exit(1);
  }

  const newSection = `${startMarker}\n${cardsHtml}\n${endMarker}`;
  const updatedReadme =
    readme.substring(0, startIndex) +
    newSection +
    readme.substring(endIndex + endMarker.length);

  fs.writeFileSync(readmePath, updatedReadme, 'utf8');
  console.log('README.md updated successfully with latest projects!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
