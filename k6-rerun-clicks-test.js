import { sleep } from 'k6';
import { browser } from 'k6/browser';

export const options = {
    scenarios: {
        rerun_file_endpoint: {
            executor: 'shared-iterations',
            options: {
                browser: {
                    type: 'chromium',
                },
            },
            vus: 1,
            iterations: 1, // One iteration that clicks 10 times
            env: { PAGE: 'file' },
        },
        rerun_db_endpoint: {
            executor: 'shared-iterations',
            options: {
                browser: {
                    type: 'chromium',
                },
            },
            vus: 1,
            iterations: 1, // One iteration that clicks 10 times
            env: { PAGE: 'db' },
        },
    },
};

export default async function () {
    const context = await browser.newContext();
    const page = await context.newPage();

    const pageType = __ENV.PAGE || 'file';
    const RERUN_CLICKS = 10;
    let url = 'http://localhost:3001/file';

    if (pageType === 'db') {
        url = 'http://localhost:3001/db';
    }

    try {
        console.log(`[${pageType}] Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle' });

        console.log(`[${pageType}] Waiting for page to fully load...`);
        await sleep(2);

        // Find and click the Rerun button 10 times
        console.log(`[${pageType}] Starting to click Rerun button ${RERUN_CLICKS} times...`);

        for (let i = 1; i <= RERUN_CLICKS; i++) {
            try {
                // Find the button by ID
                const rerunButton = page.locator('#rerun-button');

                // Wait for button to be visible and enabled (not disabled)
                await rerunButton.waitFor({ state: 'visible', timeout: 10000 });

                // Check if button is enabled before clicking
                const isDisabled = await rerunButton.getAttribute('disabled');
                if (isDisabled !== null) {
                    console.log(`[${pageType}] Waiting for button to be enabled...`);
                    await sleep(1);
                    continue;
                }

                console.log(`[${pageType}] Click ${i}/${RERUN_CLICKS}...`);
                await rerunButton.click();

                // Wait for the loading state (button becomes disabled)
                await sleep(0.3);

                // Wait for button to be enabled again (request completed)
                let maxWait = 20; // 10 seconds max
                while (maxWait > 0) {
                    const disabled = await page.locator('#rerun-button').getAttribute('disabled');
                    if (disabled === null) {
                        break;
                    }
                    await sleep(0.5);
                    maxWait--;
                }

                console.log(`[${pageType}] ✓ Click ${i}/${RERUN_CLICKS} completed`);
            } catch (error) {
                console.error(`[${pageType}] Error on click ${i}:`, error.message || error);
                // Take a screenshot for debugging
                await page.screenshot({ path: `error-${pageType}-click-${i}.png` });
            }
        }

        console.log(`[${pageType}] ✅ Completed ${RERUN_CLICKS} clicks. Waiting for final metrics export...`);
        // Wait for final batch of metrics to export (5 second export interval)
        await sleep(6);
    } catch (error) {
        console.error(`[${pageType}] Error during test:`, error);
    } finally {
        await page.close();
        await context.close();
    }
}
