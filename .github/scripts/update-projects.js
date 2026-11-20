const fs = require('fs');
const path = require('path');

const USERNAME = 'HarryNguyen510';
const MAX_PROJECTS = 4;

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    'User-Agent': 'GitHub-Action-HarryNguyen510',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // Lấy danh sách repo thuộc sở hữu user (tối đa 100 repo mỗi trang)
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100&type=owner`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch repos: ${res.status} ${res.statusText}`);
  }

  const repos = await res.json();

  // Lọc: Bỏ qua fork, archived, repo trùng tên profile, repo 0 sao hoặc thiếu mô tả.
  // Sắp xếp theo số sao giảm dần, repo cập nhật gần đây nhất lên trước khi hòa sao.
  const filtered = repos
    .filter(
      (repo) =>
        !repo.fork &&
        !repo.archived &&
        repo.name.toLowerCase() !== USERNAME.toLowerCase() &&
        repo.stargazers_count > 0 &&
        repo.description &&
        repo.description.trim() !== ''
    )
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        new Date(b.pushed_at) - new Date(a.pushed_at)
    );

  const selected = filtered.slice(0, MAX_PROJECTS);
  console.log(
    'Selected top projects:',
    selected.map((r) => `${r.name} (★${r.stargazers_count})`)
  );

  const cardsHtml = selected
    .map((repo) => {
      return `<a href="https://github.com/${USERNAME}/${repo.name}">\n  <img src="https://github-readme-stats.vercel.app/api/pin/?username=${USERNAME}&repo=${repo.name}&theme=tokyonight&hide_border=true" alt="${repo.name}" />\n</a>`;
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
