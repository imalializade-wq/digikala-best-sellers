const { chromium } = require('playwright');

const CATEGORIES = [
  "همه نوع کالا","موبایل","اسباب بازی","کالای دیجیتال","طلا و نقره",
  "مد و پوشاک","خانه و آشپزخانه","کالاهای خوراکی و اساسی","کتاب، لوازم تحریر و هنر",
  "پت شاپ","لوازم خانگی برقی","مادر و کودک","سلامت و پزشکی","آرایشی و بهداشتی",
  "ورزش و سفر","ابزار آلات و تجهیزات","خودرو و موتورسیکلت","محصولات بومی و محلی","کارت هدیه"
];

function clean(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}
function digitsToLatin(s) {
  const fa='۰۱۲۳۴۵۶۷۸۹', ar='٠١٢٣٤٥٦٧٨٩';
  return String(s||'').replace(/[۰-۹]/g,c=>fa.indexOf(c)).replace(/[٠-٩]/g,c=>ar.indexOf(c));
}
function numberFromText(s) {
  const x = digitsToLatin(s).replace(/[,\u066C]/g,'').match(/\d+/g);
  return x ? Number(x.join('')) : null;
}

async function scrapeCategory(page, category) {
  // Click the category pill by visible text. If it is not found, keep current category.
  const candidates = page.getByText(category, {exact:true});
  if (await candidates.count()) {
    await candidates.first().click({timeout:10000}).catch(()=>{});
    await page.waitForTimeout(1200);
  }

  // Product links on the best-selling page have product/dkp URLs.
  const items = await page.locator('a[href*="/product/dkp-"]').evaluateAll(els => {
    return els.map(a => {
      const href = a.href;
      const text = (a.innerText || a.textContent || '').replace(/\s+/g,' ').trim();
      return {href, text};
    });
  });

  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    if (!item.text) continue;
    out.push(item);
    if (out.length >= 50) break;
  }

  return out.map((x, i) => {
    const t = x.text;
    const rating = t.match(/([۰-۹٠-٩]?(?:\.[۰-۹٠-٩]+)?)\s*$/)?.[1] || '';
    return {
      date: new Date().toISOString(),
      category,
      rank: i + 1,
      name: t,
      rating,
      price: '',
      url: x.href
    };
  });
}

(async () => {
  const webhook = process.env.SHEET_WEBHOOK_URL;
  if (!webhook) throw new Error('Missing SHEET_WEBHOOK_URL');

  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({locale:'fa-IR', viewport:{width:1440,height:1000}});
  await page.goto('https://www.digikala.com/best-selling/', {waitUntil:'domcontentloaded', timeout:60000});
  await page.waitForTimeout(2500);

  const rows = [];
  for (const category of CATEGORIES) {
    console.log('Scraping', category);
    try {
      const data = await scrapeCategory(page, category);
      for (const x of data) rows.push(x);
    } catch (e) {
      console.error('Category failed:', category, e.message);
    }
  }

  await page.close();
  await browser.close();

  const resp = await fetch(webhook, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({rows})
  });
  if (!resp.ok) throw new Error(`Webhook failed: ${resp.status} ${await resp.text()}`);
  console.log(`Sent ${rows.length} rows`);
})();
