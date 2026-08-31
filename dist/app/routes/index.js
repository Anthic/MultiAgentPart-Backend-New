"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_route_1 = require("../modules/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const research_route_1 = require("../modules/research/research.route");
const paper_route_1 = require("../modules/paper/paper.route");
const note_route_1 = require("../modules/note/note.route");
const wallet_route_1 = require("../modules/wallet/wallet.route");
const payment_route_1 = require("../modules/payment/payment.route");
const paraphrase_route_1 = require("../modules/paraphrase/paraphrase.route");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: '/users',
        route: user_route_1.UserRoutes,
    },
    {
        path: '/auth',
        route: auth_route_1.AuthRoutes,
    },
    {
        path: '/research',
        route: research_route_1.ResearchRoutes,
    },
    {
        path: '/papers',
        route: paper_route_1.PaperRoutes,
    },
    {
        path: '/notes',
        route: note_route_1.NoteRoutes,
    },
    {
        path: '/wallet',
        route: wallet_route_1.WalletRoutes,
    },
    {
        path: '/payment',
        route: payment_route_1.PaymentRoutes,
    },
    {
        path: '/paraphrase',
        route: paraphrase_route_1.ParaphraseRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
//# sourceMappingURL=index.js.map