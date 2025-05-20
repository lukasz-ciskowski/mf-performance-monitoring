import { Suspense, type PropsWithChildren } from 'react';

const SuspenseWithTracing = (props: PropsWithChildren) => {
    return <Suspense fallback={<div>Loading...</div>}>{props.children}</Suspense>;
};
export default SuspenseWithTracing;
