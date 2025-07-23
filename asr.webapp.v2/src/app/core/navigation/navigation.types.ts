import { FuseNavigationItem } from '@fuse/components/navigation';

export interface Navigation {
    compact: FuseNavigationItem[];
    default: FuseNavigationItem[];
    futuristic: FuseNavigationItem[];
    horizontal: FuseNavigationItem[];
}

export interface NavigationModel {
    defaultNavigation: FuseNavigationItem[];
    compactNavigation: FuseNavigationItem[];
    futuristicNavigation: FuseNavigationItem[];
    horizontalNavigation: FuseNavigationItem[];
}
