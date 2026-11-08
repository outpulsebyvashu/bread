// Whether this build is a demo. Sample sign-ins and "demo code" hints appear only when it is.
// Local development counts as a demo. A production build is a demo only if NEXT_PUBLIC_BREADPOS_DEMO=1
// was set when it was built (both values are fixed into the build, so a live shop cannot show them by accident).
export const DEMO_DEPLOYMENT = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_BREADPOS_DEMO === "1";
