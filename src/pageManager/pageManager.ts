import { type Browser, type Page } from 'puppeteer'
import { logger } from '../utils/logger'

export class PageManager {
  private pages: Page[] = []
  private readonly poolSize: number

  private constructor (private readonly puppeeterBrowser: Browser, poolSize: number) {
    this.poolSize = poolSize
  }

  public async acquirePage (): Promise<Page> {
    logger.info('Acquiring page')
    if (this.pages.length === 0) {
      return await this.createNewPage()
    } else {
      return this.pages.pop()!
    }
  }

  public async releasePage (page: Page): Promise<void> {
    logger.info('Releasing page')
    await page.goto('about:blank')
    this.pages.push(page)
  }

  private async init (): Promise<void> {
    const promises: Array<Promise<Page>> = []
    for (let i = 0; i < this.poolSize; i++) {
      promises.push(this.createNewPage())
    }
    this.pages = await Promise.all(promises)
  }

  private async createNewPage (): Promise<Page> {
    logger.info('Creating new page')
    const newBrowserContext = await this.puppeeterBrowser.createIncognitoBrowserContext()
    return await newBrowserContext.newPage()
  }

  public static async create (puppeeterBrowser: Browser, poolSize: number): Promise<PageManager> {
    logger.info('Creating new page manager')
    const pageManager = new PageManager(puppeeterBrowser, poolSize)
    await pageManager.init()
    return pageManager
  }
}
