import { Navigate } from "react-router-dom";
import { DEFAULT_BOLAO_PATH } from "@/lib/bolao-config";

/** Redireciona para o bolão único */
const BolaoList = () => <Navigate to={DEFAULT_BOLAO_PATH} replace />;

export default BolaoList;
