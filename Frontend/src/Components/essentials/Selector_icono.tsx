import ModalSelectorCosmetico, { type Cosmetico } from './Selector_cosmetico';

interface SelectorIconoProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (idSeleccionado: number) => void | Promise<void>;
    items: Cosmetico[];
    idActual: number;
}

export default function SelectorIcono(props: SelectorIconoProps) {
    return <ModalSelectorCosmetico {...props} tipo="icono" />;
}
