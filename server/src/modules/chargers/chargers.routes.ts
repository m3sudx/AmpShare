import { Router } from "express";
import { getNearbyChargers,createChargerHandler,listChargersHandler, getChargerByIdHandler, listMyChargersHandler, updateChargerHandler, deleteChargerHandler } from "./chargers.controller";
const chargersRoute= Router()

chargersRoute.get('/nearby',getNearbyChargers)
chargersRoute.post('/',createChargerHandler)
chargersRoute.get('/',listChargersHandler)
chargersRoute.get('/mine',listMyChargersHandler);
chargersRoute.get('/:id',getChargerByIdHandler);
chargersRoute.patch('/:id',updateChargerHandler);
chargersRoute.delete('/:id',deleteChargerHandler);


export default chargersRoute