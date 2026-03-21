import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  auth = inject(AuthService);

  menuOpen    = signal(false);
  userMenuOpen = signal(false);

  user     = computed(() => this.auth.currentUser());
  isAdmin  = computed(() => this.auth.isAdmin());

  navItems: NavItem[] = [
    { label: 'Panel de Aulas', route: '/home',      icon: 'grid_view'   },
    { label: 'Personal',       route: '/personal',  icon: 'badge',       adminOnly: true },
    { label: 'Materias',       route: '/materias',  icon: 'menu_book'   },
    { label: 'Grupos',         route: '/grupos',    icon: 'groups'      },
  ];

  visibleNav = computed(() =>
    this.navItems.filter(i => !i.adminOnly || this.isAdmin())
  );

  toggleMenu():     void { this.menuOpen.update(v => !v); this.userMenuOpen.set(false); }
  toggleUserMenu(): void { this.userMenuOpen.update(v => !v); this.menuOpen.set(false); }
  closeAll():       void { this.menuOpen.set(false); this.userMenuOpen.set(false); }

  logout(): void { this.auth.logout(); this.closeAll(); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.header-nav-wrapper') && !target.closest('.user-menu-wrapper')) {
      this.closeAll();
    }
  }
}
