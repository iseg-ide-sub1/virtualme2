import { createI18n } from 'vue-i18n';

import zh_cn from './lang/zh-cn';
import en from './lang/en';

const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
        zh_cn,
        en
    }
});

export default i18n;
