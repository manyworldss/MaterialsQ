console.log("MaterialIQ Content Script Loaded");

export function extractProductData() {
  // 1. Title
  const titleEl = document.querySelector('h1');
  const title = titleEl ? titleEl.innerText.trim() : 'Unknown Product';

  // 2. Price
  let price = '';
  const priceMeta = document.querySelector('meta[property="product:price:amount"]');
  if (priceMeta) {
    price = priceMeta.getAttribute('content') || '';
  } else {
    // Fallback: look for typical price elements
    const priceEls = document.querySelectorAll('.price, [class*="price"], .fr-price');
    for (const el of Array.from(priceEls)) {
      if (el.textContent && el.textContent.includes('$')) {
        price = el.textContent.replace(/[^0-9.$]/g, '').trim();
        break;
      }
    }
  }

  // 3. Materials / Composition
  let materialsText = '';
  
  // Look for schema.org data or JSON-LD which Uniqlo often uses
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of Array.from(scripts)) {
    try {
      if (script.textContent) {
         const data = JSON.parse(script.textContent);
         if (data.description) {
           materialsText += data.description + '\n';
         }
      }
    } catch(e) {
      // ignore parse errors
    }
  }

  // Try finding standard Uniqlo material headers in the DOM
  const sectionHeaders = document.querySelectorAll('h2, h3, dt, summary, div');
  for (const header of Array.from(sectionHeaders)) {
    const text = header.textContent?.toLowerCase() || '';
    if (text === 'materials' || text === 'fabric details' || text === 'composition' || text.includes('materials & care')) {
      const content = header.nextElementSibling || header.parentElement;
      if (content) {
        materialsText += content.textContent + '\n';
      }
    }
  }

  // Fallback: Grab the whole details block
  if (!materialsText) {
    const details = document.querySelector('#description, .description, [class*="description"], [data-test="product-description"]');
    if (details) {
      materialsText = details.textContent || '';
    }
  }
  
  // Aggressive fallback: Extract lines with percentages if we still don't have good text
  if (!materialsText.includes('%')) {
     const bodyText = document.body.innerText;
     const lines = bodyText.split('\n');
     for (const line of lines) {
       if (line.includes('%') && (line.toLowerCase().includes('cotton') || line.toLowerCase().includes('polyester') || line.toLowerCase().includes('nylon'))) {
         materialsText += line + '\n';
       }
     }
  }

  const url = window.location.href;

  return {
    title,
    price,
    materialsText: materialsText.trim(),
    url
  };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ANALYZE_PAGE') {
    const data = extractProductData();
    console.log("MaterialIQ Extracted Data:", data);
    sendResponse(data);
  }
  return true; 
});
