import ModalSelectorCosmetico, { type Cosmetico } from './Selector_cosmetico';

interface SelectorTarjetaProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (idSeleccionado: number) => void | Promise<void>;
    items: Cosmetico[];
    idActual: number;
}

export default function SelectorTarjeta(props: SelectorTarjetaProps) {
    return <ModalSelectorCosmetico {...props} tipo="tarjeta" />;
}
