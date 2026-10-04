#!/usr/bin/env node
import { createProgram } from './program'

await createProgram().parseAsync()
