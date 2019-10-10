export default (xml) => {
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(`${xml.data}`, 'application/xml');
  const channel = doc.querySelector('channel');
  const title = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;
  const items = channel.querySelectorAll('item');
  const itemsList = [...items].map((item) => {
    const pubDate = new Date(item.querySelector('pubDate').textContent);
    const itemTitle = item.querySelector('title').textContent;
    const itemDescription = item.querySelector('description').textContent;
    const itemLink = item.querySelector('link').textContent;
    return {
      pubDate, itemTitle, itemDescription, itemLink,
    };
  });
  return { title, description, itemsList };
};
