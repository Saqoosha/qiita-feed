import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { qiita } from "libs/apiClient";
import { convert } from "html-to-text";
import xmlescape from 'xml-escape';

export const app = new Hono();

app.use("*", poweredBy());

app.get("/:id", async (c) => {
  const id = c.req.param("id");

  const items = await qiita.v2.items.$get({
    query: {
      query: `user:${id}`,
    },
  });

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<feed xml:lang="ja-JP" xmlns="http://www.w3.org/2005/Atom">`,
    `  <id>tag:qiita.com,2005:/${id}/feed</id>`,
    `  <link rel="alternate" type="text/html" href="https://qiita.com"/>`,
    `  <link rel="self" type="application/atom+xml" href="${c.req.url}"/>`,
    `  <title>${id}の記事 - Qiita</title>`,
    `  <description>Qiitaでユーザー${id}による記事</description>`,
    `  <updated>${items[0].created_at}</updated>`,
    `  <link>https://qiita.com/${id}</link>`,
    ...items.map<string>((item) =>
      [
        `  <entry>`,
        `    <id>tag:qiita.com,2005:PublicArticle/${item.id}</id>`,
        `    <published>${item.created_at}</published>`,
        `    <updated>${item.updated_at}</updated>`,
        `    <link rel="alternate" type="text/html" href="${item.url}" />`,
        `    <url>${item.url}</url>`,
        `    <title>${xmlescape(item.title)}</title>`,
        `    <content type="html">${xmlescape(convert(item.rendered_body).substring(0, 200))}</content>`,
        `    <author>`,
        `      <name>${id}</name>`,
        `    </author>`,
        `  </entry>`,
      ].join("\n")
    ),
    `</feed>`,
  ].join("\n");

  return c.text(xml, 200);
});

app.fire();
