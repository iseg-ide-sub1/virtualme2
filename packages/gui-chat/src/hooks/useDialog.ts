import { reactive } from "vue";
import type { DialogItem } from '@/types';

export default function useDialog() {
    const dialog: DialogItem[] = reactive([]);
    
}