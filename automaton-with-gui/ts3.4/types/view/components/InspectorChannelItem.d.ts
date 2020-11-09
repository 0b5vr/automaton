/// <reference types="react" />
interface Props {
}
interface Props {
    className?: string;
    item: {
        id: string;
        channel: string;
    };
}
declare const InspectorChannelItem: (props: Props) => JSX.Element | null;
export { InspectorChannelItem };
