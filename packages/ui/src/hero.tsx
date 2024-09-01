export const HeroBackground = () => {
    return (
        <div className="bg-background absolute inset-0 z-[-1] flex flex-1 items-start justify-center">
            <div className="relative mt-[18vh] size-[180px] rounded-full md:size-[240px] lg:size-[20vw]">
                <div className="bg-accent absolute size-[180px] translate-x-[24%] rounded-full md:size-[240px] lg:size-[20vw]" />
                <div className="bg-accent-secondary absolute size-[180px] translate-x-[-24%] rounded-full md:size-[240px] lg:size-[20vw]" />
            </div>
            <div className="bg-background/20 absolute left-0 top-0 size-full backdrop-blur-[72px] md:backdrop-blur-[108px]" />
        </div>
    );
};
