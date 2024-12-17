import { confirmedOrderPaymentStatus, confirmedOrderStatus, createOrder, getAllOrders, getAllUserOrders, getOrderById, totalNumberOfConfirmedOrders, totalNumberOfOrders, totalNumberOfPendingOrders, totalNumberOfProcessingOrders, totalNumberOfShippedOrders, updateOrderToProcessing } from "#/controller/order";
import { isAdmin, mustAuth } from "#/middleware/user";
import { Router } from "express";

const router = Router();

router.post('/create-order', mustAuth, createOrder)
router.get('/user-orders', mustAuth, getAllUserOrders)
router.get('/:orderId', mustAuth, getOrderById)
router.post('/:orderId', mustAuth, isAdmin, confirmedOrderStatus)
router.post('/update-order/:orderId', mustAuth, updateOrderToProcessing)
router.post('/confirm-payment/:orderId', mustAuth, isAdmin, confirmedOrderPaymentStatus)
router.get('/total/confimed-orders', mustAuth, isAdmin, totalNumberOfConfirmedOrders)
router.get('/total/shipped-orders', mustAuth, isAdmin, totalNumberOfShippedOrders)
router.get('/total/pending-orders', mustAuth, isAdmin, totalNumberOfPendingOrders)
router.get('/total/orders', mustAuth, isAdmin, totalNumberOfOrders)
router.get('/total/processing-orders', mustAuth, isAdmin, totalNumberOfProcessingOrders)
router.get('/all/orders', isAdmin, getAllOrders);
router.get('/userOrder', mustAuth, getAllUserOrders);
// router.post('/:order', mustAuth, confirmOrderByuser);

export default router;  