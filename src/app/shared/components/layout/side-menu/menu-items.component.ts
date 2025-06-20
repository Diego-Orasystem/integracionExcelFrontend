import { Component, Input } from '@angular/core';
import { MenuItem } from '../../../../core/models/menu-item.model';

@Component({
  selector: 'app-menu-items',
  templateUrl: './menu-items.component.html',
  styleUrls: ['./menu-items.component.scss']
})
export class MenuItemsComponent {
  @Input() items: MenuItem[] = [];
  @Input() currentRoute: string = '';
  
  expandedItems: { [key: string]: boolean } = {};
  
  /**
   * Alterna la expansión de un ítem de menú
   */
  toggleExpand(itemId: string): void {
    this.expandedItems[itemId] = !this.expandedItems[itemId];
  }
  
  /**
   * Verifica si un ítem está expandido
   */
  isExpanded(itemId: string): boolean {
    return !!this.expandedItems[itemId];
  }
  
  /**
   * Verifica si una ruta está activa
   */
  isActiveRoute(url: string | undefined): boolean {
    if (!url) return false;
    return this.currentRoute === url || this.currentRoute.startsWith(`${url}/`);
  }
  
  /**
   * Verifica si algún hijo de un ítem está activo
   */
  hasActiveChild(item: MenuItem): boolean {
    if (!item.children || item.children.length === 0) {
      return false;
    }
    
    return item.children.some(child => 
      this.isActiveRoute(child.url) || this.hasActiveChild(child)
    );
  }
} 