import axios from "axios";
import { baseURL } from "../common";

const request = axios.create({
    baseURL, timeout: 60000
})

export default request;