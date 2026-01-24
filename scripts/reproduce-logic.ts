
function testLogic(body: any) {
    const {
        campaignSource, utm_source, source
    } = body;

    let normalizedSource = campaignSource;

    console.log(`--- Testing Input: utm_source="${utm_source}", source="${source}", campaignSource="${campaignSource}" ---`);

    if (!normalizedSource) {
        const rawSource = (utm_source || source || "").toLowerCase();
        console.log(`rawSource: "${rawSource}"`);

        if (rawSource) {
            if (rawSource.includes("google") || rawSource.includes("adwords")) {
                normalizedSource = "Google";
                console.log("Matched: Google");
            } else if (rawSource.includes("meta") || rawSource.includes("facebook") || rawSource.includes("instagram")) {
                normalizedSource = "Meta";
                console.log("Matched: Meta");
            } else {
                normalizedSource = utm_source || source;
                console.log("Fallback: ", normalizedSource);
            }
        } else {
            console.log("rawSource is falsy, skipping match.");
        }
    } else {
        console.log("normalizedSource already set (skipped logic):", normalizedSource);
    }

    console.log(`FINAL RESULTS -> campaignSource: "${normalizedSource}", utmSource: "${utm_source || source}"`);
    console.log("");
}

// Test cases
testLogic({ utm_source: "adwords" });
testLogic({ utm_source: "Google_Ads" });
testLogic({ source: "facebook" });
testLogic({ utm_source: "unknown" });
testLogic({ campaignSource: "Manual" });
testLogic({ campaignSource: null, utm_source: "adwords" });
testLogic({ campaignSource: "", utm_source: "adwords" });
