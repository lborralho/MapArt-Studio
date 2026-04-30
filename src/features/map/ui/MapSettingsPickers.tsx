import RatioCard from "@/features/layout/ui/LayoutCard";
import PickerModal from "@/shared/ui/PickerModal";
import type { PosterRatioGroup } from "@/features/layout/domain/types";

interface MapSettingsPickersProps {
  activePicker: string;
  onClosePicker: () => void;
  ratioGroups: PosterRatioGroup[];
  selectedRatioId: string;
  onRatioSelect: (ratioId: string) => void;
}

export default function MapSettingsPickers({
  activePicker,
  onClosePicker,
  ratioGroups,
  selectedRatioId,
  onRatioSelect,
}: MapSettingsPickersProps) {
  return (
    <>
      <PickerModal
        open={activePicker === "layout"}
        title="Choose Ratio"
        titleId="ratio-picker-title"
        onClose={onClosePicker}
      >
        <div className="layout-picker-groups">
          {ratioGroups.map((group) => (
            <section
              key={group.id}
              className="layout-picker-group"
              aria-label={group.name}
            >
              <h4>{group.name}</h4>
              <div className="picker-option-list card-scroll-list">
                {group.options.map((ratioOption) => (
                  <RatioCard
                    key={ratioOption.id}
                    ratioOption={ratioOption}
                    isSelected={ratioOption.id === selectedRatioId}
                    onClick={() => onRatioSelect(ratioOption.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </PickerModal>
    </>
  );
}
