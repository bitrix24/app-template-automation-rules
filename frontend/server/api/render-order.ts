import jwt from 'jsonwebtoken'
import { generatePDF } from './../utils/pdf-generator'

/**
 * Demo how generate pdf from html
 * @link /api/render-order?taskId=xx-yy-xxx
 * @link /render/order?taskId=xx-yy-xxx
 * @link /render/order?taskId=123-123-123
 *
 * @todo change to worker && add post for hook from B24
 * @todo add validate b24 hook
 */
export default defineEventHandler(async (event) => {
  /**
   * @todo remove this
   */
  const startTotal = Date.now()

  // Getting query parameters
  const query = getQuery(event)
  const taskId = query.taskId?.toString()

  // Parameter Validation
  if (!taskId) {
    setResponseStatus(event, 400)
    return { error: 'Missing taskId parameter' }
  }

  const config = useRuntimeConfig()
  // Generate JWT token
  const token = jwt.sign(
    { taskId, timestamp: Date.now() },
    config.jwtSecret,
    { expiresIn: '5m' }
  )

  const pdfBuffer = await generatePDF(
    `/render/invoice-by-deal/${taskId}/`,
    { token, taskId }
  )

  // Returning the answer
  /**
   * @todo remove this
   */
  console.log(JSON.stringify({
    total: Date.now() - startTotal
  }))
  event.node.res.setHeader('Content-Type', 'application/pdf')
  event.node.res.setHeader('Content-Disposition', 'attachment; filename="generated.pdf"')
  event.node.res.end(pdfBuffer)

  // return {
  //   // 'PDF-buffer-here' ////
  //   pdf: token
  // }
})
