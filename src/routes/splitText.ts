import type { Router as ExpressRouter } from 'express'
import { Router } from 'express'

import { splitText } from '../controller/splitText.js'

const splitTextRouter: ExpressRouter = Router()

splitTextRouter.post('/', splitText)

export default splitTextRouter
