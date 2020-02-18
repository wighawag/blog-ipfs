import { getPosts } from './blog/_posts.js';

const siteUrl = 'https://wighawag.eth.link';

const renderXmlRssFeed = (posts) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
<channel>
    <title><![CDATA[Wighawag's Blog]]></title>
    <link>${siteUrl}</link>
  <description><![CDATA[A developer's blog. Might be useful. Maybe.]]></description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
        <url>${siteUrl}/profile-pic-small.jpg</url>
        <title><![CDATA[Wighawag's Blog]]></title>
        <link>${siteUrl}</link>
    </image>
    ${posts.map(post => `
        <item>
            <title>${post.title}</title>
      <link>${siteUrl}/${post.slug}</link>
      <guid isPermaLink="false">${siteUrl}/${post.slug}</guid>
            <description><![CDATA[${post.description}]]></description>
            <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        </item>
    `).join('\n')}
</channel>
</rss>`;

export function get(req, res) {

  res.writeHead(200, {
    'Cache-Control': `max-age=0, s-max-age=${600}`, // 10 minutes
    'Content-Type': 'application/rss+xml'
  });

  const posts = getPosts();
  console.log(posts);
    // .filter(it => it.metadata.published == 'true')
    // .filter(p => p.slug.indexOf('future/') < 0 && p.slug.indexOf('alternate-reality/') < 0)

  const postsToRender = posts.map(post => {
      return {
        title: post.metadata.title,
        date: post.metadata.pubdate,
        description: post.html,
        slug: post.slug,
      };
    });
  const feed = renderXmlRssFeed(postsToRender);
  res.end(feed);

}