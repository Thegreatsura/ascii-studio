import CopyDropdown from "./copy-drop-down";
import { useSearch } from "./search-context";
import { regularAnimations } from "../ascii/_registry";

export default function AsciiAnimationsTabs() {
  const { query } = useSearch();
  const normalizedQuery = query.trim().toLowerCase();

  const filteredAnimations = regularAnimations.filter((item) => {
    if (!normalizedQuery) return true;
    return (
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery) ||
      item.registryName.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <div className="w-full flex flex-col items-center gap-4 mt-6">
      <div className="grid grid-cols-1 pb-3 sm:grid-cols-2 gap-2 w-[95vw] sm:w-[70vw] mx-auto">
        {filteredAnimations.length === 0 && (
          <div className="text-center text-muted-foreground col-span-full">
            No results found.
          </div>
        )}
        {filteredAnimations.map((item, index) => (
          <div
            key={index}
            className={`relative border rounded-3xl aspect-square flex items-center justify-center overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${item.landscape ? "sm:col-span-2" : ""}`}
          >
            <div className="z-30">{item.render()}</div>
            <div className="leading-1 absolute left-4 bottom-4">
              <p className="text-xs font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
            <div className=" absolute top-2 right-2">
              <CopyDropdown registryName={item.registryName} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
