import type { OrgSettings } from "../types/config";

export const defaultOrgSettings: OrgSettings = {
	Address: "",
	Contact: {
		Email: "",
		Facebook: "",
		Instagram: "",
		Phone: "+237 123456789",
		WhatsApp: "+237 123456789"
	},
	MaintenanceMode: false,
	LateReturnPenalties: [""],
	Logo: "",
	MaximumSimultaneousLoans: 3,
	Name: "Default Library",
	OpeningHours: {
		Monday: '{"open": "08:00", "close": "18:00"}',
		Tuesday: '{"open": "08:00", "close": "18:00"}',
		Wednesday: '{"open": "08:00", "close": "18:00"}',
		Thursday: '{"open": "08:00", "close": "18:00"}',
		Friday: '{"open": "08:00", "close": "18:00"}',
		Saturday: '{"open": "10:00", "close": "18:00"}',
		Sunday: '{"open": "closed", "close": "closed"}'
	},
	SpecificBorrowingRules: [""],
	Theme: {
		Primary: "#D2691E",   // Chocolate color
		Secondary: "#E7DAC1", // Beige color
	}
};
