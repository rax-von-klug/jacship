'use strict';

import VerEx from 'verbal-expressions';

export function is_url(value) {
    let urlTester = VerEx().startOfLine().then('http').maybe('s').then('://').maybe('www.').anythingBut(' ').endOfLine();

    return urlTester.test(value);
}