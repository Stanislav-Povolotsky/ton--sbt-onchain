import {Address} from '@ton/core';
import { randomBytes } from 'crypto'


export function randomAddress() {
    return new Address(0, randomBytes(256/8))
}