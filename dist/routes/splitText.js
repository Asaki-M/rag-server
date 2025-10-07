import { Router } from 'express';
import { splitText } from '../controller/splitText.js';
const splitTextRouter = Router();
splitTextRouter.post('/', splitText);
export default splitTextRouter;
//# sourceMappingURL=splitText.js.map