import { sleep } from 'k6';
import { browser } from 'k6/browser';

export const options = {
    scenarios: {
        home_page: {
            executor: 'shared-iterations',
            options: {
                browser: {
                    type: 'chromium',
                },
            },
            vus: 1,
            iterations: 40,
            env: { PAGE: 'home' },
        },
        file_page: {
            executor: 'shared-iterations',
            options: {
                browser: {
                    type: 'chromium',
                },
            },
            vus: 1,
            iterations: 40,
            env: { PAGE: 'file' },
        },
        db_page: {
            executor: 'shared-iterations',
            options: {
                browser: {
                    type: 'chromium',
                },
            },
            vus: 1,
            iterations: 40,
            env: { PAGE: 'db' },
        },
    },
};

export default async function () {
    const context = await browser.newContext();
    const page = await context.newPage();

    const pageType = __ENV.PAGE || 'home';
    let url = 'http://localhost:3001/';

    if (pageType === 'file') {
        url = 'http://localhost:3001/file';
    } else if (pageType === 'db') {
        url = 'http://localhost:3001/db';
    }

    try {
        console.log(`[${pageType}] Navigating to ${url}...`);
        await page.goto(url);

        // Wait for web vitals to be captured and metrics to be sent
        // Export interval is 500ms, so wait at least 1.5 seconds to ensure export completes
        console.log(`[${pageType}] Waiting for metrics to be captured and exported...`);
        await sleep(3);

        console.log(`✓ [${pageType}] Page loaded, metrics should be exported`);
    } catch (error) {
        console.error(`[${pageType}] Error during test:`, error);
    } finally {
        // Give extra time before closing to ensure metrics are fully sent
        await sleep(0.5);
        await page.close();
        await context.close();
    }
}
